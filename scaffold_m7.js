const fs = require('fs');
const path = require('path');

const files = {
  'src/config/env.validator.ts': `import { z } from 'zod';
import { config } from 'dotenv';

config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string").default("postgres://user:pass@localhost:5432/db"),
  HEADLESS: z.enum(['true', 'false']).default('true'),
  KEYWORD: z.string().min(1, "KEYWORD is required").default("Resorts"),
  MAX_RESULTS: z.string().transform(Number).default('50'),
  SCROLL_DELAY: z.string().transform(Number).default('1000'),
  SCROLL_STEP: z.string().transform(Number).default('1000'),
  MAX_IDLE_SCROLLS: z.string().transform(Number).default('10'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  MAX_RETRIES: z.string().transform(Number).default('3'),
  PAGE_TIMEOUT: z.string().transform(Number).default('30000'),
  CONCURRENCY: z.string().transform(Number).default('3'),
  QUEUE_HIGH_WATER_MARK: z.string().transform(Number).default('50'),
  QUEUE_LOW_WATER_MARK: z.string().transform(Number).default('20')
});

export const env = envSchema.parse(process.env);
`,
  'src/models/ExtractionJob.ts': `export enum JobStatus {
  DISCOVERED = 'DISCOVERED',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  EXTRACTED = 'EXTRACTED',
  VALIDATED = 'VALIDATED',
  SAVED = 'SAVED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  FAILED_PERMANENT = 'FAILED_PERMANENT'
}

export interface ExtractionJob {
  id: string;
  url: string;
  provider: string;
  keyword: string;
  status: JobStatus;
  attempts: number;
  discoveredAt: Date;
  priority: number;
  lastError?: string;
  data?: any;
}
`,
  'src/core/queue/Queue.ts': `export interface Queue<T> {
  enqueue(item: T): Promise<void>;
  dequeue(): Promise<T | null>;
  peek(): Promise<T | null>;
  size(): Promise<number>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  isPaused(): Promise<boolean>;
}
`,
  'src/core/queue/MemoryQueue.ts': `import { Queue } from './Queue';

export class MemoryQueue<T> implements Queue<T> {
  private items: T[] = [];
  private paused: boolean = false;

  async enqueue(item: T): Promise<void> {
    this.items.push(item);
  }

  async dequeue(): Promise<T | null> {
    if (this.paused) return null;
    return this.items.shift() || null;
  }

  async peek(): Promise<T | null> {
    return this.items[0] || null;
  }

  async size(): Promise<number> {
    return this.items.length;
  }
  
  async pause(): Promise<void> {
    this.paused = true;
  }
  
  async resume(): Promise<void> {
    this.paused = false;
  }
  
  async isPaused(): Promise<boolean> {
    return this.paused;
  }
}
`,
  'src/providers/google-maps/scroll/ResultCollector.ts': `import { Page } from 'playwright';
import { BusinessSelectors } from '../selectors/BusinessSelectors';
import { ResultValidator } from './ResultValidator';
import { ResultCache } from './ResultCache';
import { EventBus, EventTypes } from '../../../core/events/EventBus';
import { Queue } from '../../../core/queue/Queue';
import { ExtractionJob, JobStatus } from '../../../models/ExtractionJob';
import crypto from 'crypto';

export class ResultCollector {
  constructor(private page: Page, private cache: ResultCache, private queue: Queue<ExtractionJob>, private keyword: string) {}

  async collectCurrentBatch(): Promise<string[]> {
    const collectedInBatch: string[] = [];
    
    const hrefs = await this.page.evaluate((selector) => {
      const anchors = Array.from(document.querySelectorAll(selector));
      return anchors.map(a => a.getAttribute('href') || '');
    }, BusinessSelectors.businessCardLink);

    for (const rawUrl of hrefs) {
      if (ResultValidator.isValid(rawUrl)) {
        const normalizedUrl = ResultValidator.normalize(rawUrl);
        
        if (this.cache.add(normalizedUrl)) {
          collectedInBatch.push(normalizedUrl);
          
          const job: ExtractionJob = {
            id: crypto.randomUUID(),
            url: normalizedUrl,
            provider: 'google-maps',
            keyword: this.keyword,
            status: JobStatus.DISCOVERED,
            attempts: 0,
            discoveredAt: new Date(),
            priority: 1
          };
          
          EventBus.publish(EventTypes.UrlCollected, { url: normalizedUrl });
          
          // Stream it immediately to Queue
          job.status = JobStatus.QUEUED;
          await this.queue.enqueue(job);
          
        } else {
          EventBus.publish(EventTypes.DuplicateSkipped, { url: normalizedUrl });
        }
      }
    }
    
    if (collectedInBatch.length > 0) {
      EventBus.publish(EventTypes.NewBusinessesLoaded, { count: collectedInBatch.length });
    }
    
    return collectedInBatch;
  }
}
`,
  'src/providers/google-maps/scroll/InfiniteScroller.ts': `import { Page } from 'playwright';
import { SearchSelectors } from '../selectors/SearchSelectors';
import { BusinessSelectors } from '../selectors/BusinessSelectors';
import { ResultCollector } from './ResultCollector';
import { ConfigService } from '../../../config/ConfigService';
import { EventBus, EventTypes } from '../../../core/events/EventBus';
import { Queue } from '../../../core/queue/Queue';
import { ExtractionJob } from '../../../models/ExtractionJob';
import { logger } from '../../../core/logger/Logger';

export class InfiniteScroller {
  constructor(private page: Page, private collector: ResultCollector, private queue: Queue<ExtractionJob>) {}

  async scrollUntilComplete(): Promise<void> {
    const maxResults = Number(ConfigService.get('MAX_RESULTS'));
    const scrollStep = Number(ConfigService.get('SCROLL_STEP'));
    const scrollDelay = Number(ConfigService.get('SCROLL_DELAY'));
    const maxIdleScrolls = Number(ConfigService.get('MAX_IDLE_SCROLLS'));
    const highWaterMark = Number(ConfigService.get('QUEUE_HIGH_WATER_MARK') || 100);
    const lowWaterMark = Number(ConfigService.get('QUEUE_LOW_WATER_MARK') || 20);

    let scrollCount = 0;
    let idleScrolls = 0;
    let totalCollected = 0;

    EventBus.publish(EventTypes.ScrollStarted, { time: new Date() });

    while (totalCollected < maxResults) {
      // Check Backpressure
      const queueSize = await this.queue.size();
      if (queueSize >= highWaterMark) {
        logger.info(\`Queue Backpressure triggered (Size: \${queueSize}). Pausing scroll.\`);
        await this.queue.pause();
        
        // Wait until queue drains
        while (await this.queue.size() > lowWaterMark) {
          await this.page.waitForTimeout(2000);
        }
        
        logger.info(\`Queue drained (Size: \${await this.queue.size()}). Resuming scroll.\`);
        await this.queue.resume();
      }

      scrollCount++;
      EventBus.publish(EventTypes.ScrollProgress, { scrollCount });

      const newItems = await this.collector.collectCurrentBatch();
      totalCollected += newItems.length;

      if (newItems.length === 0) {
        idleScrolls++;
      } else {
        idleScrolls = 0;
      }

      if (totalCollected >= maxResults) break;
      if (await this.page.isVisible(BusinessSelectors.endOfListMarker)) break;
      if (idleScrolls >= maxIdleScrolls) break;

      await this.page.evaluate(([feedSelector, step]) => {
        const feed = document.querySelector(feedSelector as string);
        if (feed) {
          feed.scrollBy(0, step as number);
        }
      }, [SearchSelectors.resultFeed, scrollStep]);

      await this.page.waitForTimeout(scrollDelay);
    }
    
    EventBus.publish(EventTypes.CollectionCompleted, { total: totalCollected });
  }
}
`,
  'src/core/workers/WorkerPool.ts': `import { Queue } from '../queue/Queue';
import { ExtractionJob, JobStatus } from '../../models/ExtractionJob';
import { BusinessExtractionEngine } from '../../providers/google-maps/extractors/BusinessExtractionEngine';
import { BrowserContext } from 'playwright';
import { PageManager } from '../browser/PageManager';
import { EventBus, EventTypes } from '../events/EventBus';
import { logger } from '../logger/Logger';

export class WorkerPool {
  private workers: Promise<void>[] = [];
  private isRunning = false;

  constructor(
    private queue: Queue<ExtractionJob>, 
    private context: BrowserContext,
    private concurrency: number
  ) {}

  async start() {
    this.isRunning = true;
    for (let i = 0; i < this.concurrency; i++) {
      this.workers.push(this.runWorker(i));
    }
  }

  async stop() {
    this.isRunning = false;
    await Promise.all(this.workers);
  }

  private async runWorker(workerId: number) {
    logger.info(\`Worker \${workerId} started.\`);
    const pageManager = new PageManager(this.context);
    const page = await pageManager.createPage();
    
    while (this.isRunning || await this.queue.size() > 0) {
      if (await this.queue.isPaused() && await this.queue.size() === 0) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const job = await this.queue.dequeue();
      
      if (!job) {
        // Wait and poll
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      job.status = JobStatus.PROCESSING;
      logger.info(\`Worker \${workerId} processing \${job.url}\`);
      
      try {
        const engine = new BusinessExtractionEngine(page, job.keyword);
        const data = await engine.processUrl(job.url);
        
        if (data) {
          job.status = JobStatus.VALIDATED;
          job.data = data;
          EventBus.publish(EventTypes.BusinessExtracted, job); // Repository listens to this to SAVE
        } else {
          job.status = JobStatus.FAILED;
          job.lastError = "Extraction returned null";
        }
      } catch (err: any) {
        job.attempts++;
        job.lastError = err.message;
        if (job.attempts < 3) {
          job.status = JobStatus.RETRYING;
          await this.queue.enqueue(job); // Retry
        } else {
          job.status = JobStatus.FAILED_PERMANENT;
        }
        logger.error({ err, url: job.url }, \`Worker \${workerId} failed to process\`);
      }
    }
    
    await pageManager.closePage(page);
    logger.info(\`Worker \${workerId} shutdown.\`);
  }
}
`,
  'src/main.ts': `import { ConfigService } from './config/ConfigService';
import { logger } from './core/logger/Logger';
import { BrowserFactory } from './core/browser/BrowserFactory';
import { BrowserContextManager } from './core/browser/BrowserContextManager';
import { GoogleMapsProvider } from './providers/google-maps/GoogleMapsProvider';
import { ProgressTracker } from './core/progress/ProgressTracker';
import { EventBus, EventTypes } from './core/events/EventBus';
import { MemoryQueue } from './core/queue/MemoryQueue';
import { ExtractionJob, JobStatus } from './models/ExtractionJob';
import { WorkerPool } from './core/workers/WorkerPool';

async function bootstrap() {
  logger.info(\`Starting Lead Collection Platform (Streaming Pipeline)\`);
  
  const tracker = new ProgressTracker();
  const browserManager = BrowserFactory.createBrowserManager();
  
  // 1. Initialize Pipeline Queue
  const extractionQueue = new MemoryQueue<ExtractionJob>();
  
  // Simulate Repository Save
  EventBus.subscribe(EventTypes.BusinessExtracted, (job: ExtractionJob) => {
    // In production, Repository.save(job.data) goes here
    job.status = JobStatus.SAVED;
    job.status = JobStatus.COMPLETED;
    logger.info({ name: job.data.name }, "Simulated Save to Database");
  });
  
  try {
    const browser = await browserManager.initialize({ headless: ConfigService.get('HEADLESS') === 'true' });
    const contextManager = new BrowserContextManager(browser);
    const context = await contextManager.createContext();
    
    // 2. Initialize Worker Pool (Concurrency defaults to 3)
    const concurrency = Number(ConfigService.get('CONCURRENCY') || 3);
    const workerPool = new WorkerPool(extractionQueue, context, concurrency);
    
    // Start workers (they will idle until scrolling feeds the queue)
    workerPool.start();
    
    // 3. Start Discovery Engine
    const mapsProvider = new GoogleMapsProvider(context, extractionQueue);
    await mapsProvider.launch();
    
    const keyword = ConfigService.get('KEYWORD') || "Resorts";
    await mapsProvider.search(keyword, "Kerala");
    
    logger.info("Starting Infinite Scroll Discovery Pipeline...");
    
    // This feeds the queue simultaneously while workers process it
    await mapsProvider.collectUrls(); 
    
    logger.info("Scrolling finished. Waiting for worker pool to drain queue.");
    
    // 4. Drain and Graceful Shutdown
    // Wait for queue to empty
    while (await extractionQueue.size() > 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Tell workers to stop
    await workerPool.stop();
    await mapsProvider.cleanup();
    
  } catch (error) {
    logger.error({ err: error }, "Failed to execute engine");
    EventBus.publish(EventTypes.JobFailed, { error });
  } finally {
    await browserManager.closeBrowser();
    logger.info("Graceful shutdown complete.");
  }
}

bootstrap();
`,
  'src/providers/google-maps/GoogleMapsProvider.ts': `import { BaseProvider } from '../base/BaseProvider';
import { MapsNavigator } from './navigation/MapsNavigator';
import { InfiniteScroller } from './scroll/InfiniteScroller';
import { ResultCollector } from './scroll/ResultCollector';
import { ResultCache } from './scroll/ResultCache';
import { PageManager } from '../../core/browser/PageManager';
import { BrowserContext, Page } from 'playwright';
import { Queue } from '../../core/queue/Queue';
import { ExtractionJob } from '../../models/ExtractionJob';

export class GoogleMapsProvider extends BaseProvider {
  private navigator: MapsNavigator | null = null;
  private pageManager: PageManager;
  private resultCache: ResultCache;
  private page: Page | null = null;
  private keyword: string = '';
  
  constructor(context: BrowserContext, private queue: Queue<ExtractionJob>) {
    super();
    this.pageManager = new PageManager(context);
    this.resultCache = new ResultCache();
  }

  async launch(): Promise<void> {
    this.page = await this.pageManager.createPage();
    this.navigator = new MapsNavigator(this.page);
    await this.navigator.launch();
  }

  async search(keyword: string, location?: string): Promise<void> {
    this.keyword = keyword;
    if (!this.navigator) throw new Error("Navigator not initialized");
    await this.navigator.search(keyword, location || '');
    await this.navigator.waitForResults();
  }

  async collectUrls(): Promise<string[]> {
    if (!this.page) throw new Error("Browser page not initialized");
    
    const collector = new ResultCollector(this.page, this.resultCache, this.queue, this.keyword);
    const scroller = new InfiniteScroller(this.page, collector, this.queue);
    
    await scroller.scrollUntilComplete();
    return []; // We no longer return URLs synchronously. They are in the queue.
  }

  async extract(url: string): Promise<any> {
    throw new Error("Extract is now handled asynchronously by WorkerPool");
  }
  
  async cleanup(): Promise<void> {
    if (this.page) {
      await this.pageManager.closePage(this.page);
      this.page = null;
    }
  }
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created: ', filePath);
}
