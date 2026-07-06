const fs = require('fs');
const path = require('path');

const files = {
  'src/config/env.validator.ts': `import { z } from 'zod';
import { config } from 'dotenv';

config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  HEADLESS: z.enum(['true', 'false']).default('true'),
  KEYWORD: z.string().min(1, "KEYWORD is required"),
  MAX_RESULTS: z.string().transform(Number).default('50'),
  SCROLL_DELAY: z.string().transform(Number).default('1000'),
  SCROLL_STEP: z.string().transform(Number).default('1000'),
  MAX_IDLE_SCROLLS: z.string().transform(Number).default('10'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  MAX_RETRIES: z.string().transform(Number).default('3'),
  PAGE_TIMEOUT: z.string().transform(Number).default('30000'),
  CONCURRENCY: z.string().transform(Number).default('1')
});

export const env = envSchema.parse(process.env);
`,
  'src/core/events/EventBus.ts': `import { EventEmitter } from 'events';

export enum EventTypes {
  JobCreated = 'JobCreated',
  JobStarted = 'JobStarted',
  BusinessFound = 'BusinessFound',
  BusinessExtracted = 'BusinessExtracted',
  BusinessSaved = 'BusinessSaved',
  JobCompleted = 'JobCompleted',
  JobFailed = 'JobFailed',
  BrowserStarted = 'BrowserStarted',
  BrowserClosed = 'BrowserClosed',
  MapsLoaded = 'MapsLoaded',
  SearchStarted = 'SearchStarted',
  SearchCompleted = 'SearchCompleted',
  NavigationFailed = 'NavigationFailed',
  ProviderStatus = 'ProviderStatus',
  ScrollStarted = 'ScrollStarted',
  ScrollProgress = 'ScrollProgress',
  NewBusinessesLoaded = 'NewBusinessesLoaded',
  UrlCollected = 'UrlCollected',
  DuplicateSkipped = 'DuplicateSkipped',
  CollectionCompleted = 'CollectionCompleted'
}

export class EventBus {
  private static instance: EventEmitter;

  public static getInstance(): EventEmitter {
    if (!EventBus.instance) {
      EventBus.instance = new EventEmitter();
    }
    return EventBus.instance;
  }

  public static publish(event: EventTypes, payload: any): void {
    EventBus.getInstance().emit(event, payload);
  }

  public static subscribe(event: EventTypes, listener: (payload: any) => void): void {
    EventBus.getInstance().on(event, listener);
  }
}
`,
  'src/core/progress/ProgressTracker.ts': `import { EventBus, EventTypes } from '../events/EventBus';
import { logger } from '../logger/Logger';

export class ProgressTracker {
  private businessesFound = 0;
  private businessesProcessed = 0;
  private businessesFailed = 0;
  private uniqueUrls = 0;
  private duplicates = 0;
  private currentScroll = 0;
  private startTime: number = Date.now();
  private status = 'Idle';

  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    EventBus.subscribe(EventTypes.BrowserStarted, () => this.updateStatus('Browser Starting'));
    EventBus.subscribe(EventTypes.MapsLoaded, () => this.updateStatus('Opening Maps'));
    EventBus.subscribe(EventTypes.SearchStarted, () => this.updateStatus('Searching'));
    EventBus.subscribe(EventTypes.SearchCompleted, () => this.updateStatus('Waiting For Results'));
    
    EventBus.subscribe(EventTypes.ScrollStarted, () => this.updateStatus('Scrolling Results'));
    EventBus.subscribe(EventTypes.ScrollProgress, (payload: any) => {
      this.currentScroll = payload.scrollCount;
      this.logProgress();
    });
    EventBus.subscribe(EventTypes.UrlCollected, () => {
      this.uniqueUrls++;
      this.businessesFound++;
      this.logProgress();
    });
    EventBus.subscribe(EventTypes.DuplicateSkipped, () => {
      this.duplicates++;
    });
    EventBus.subscribe(EventTypes.CollectionCompleted, () => {
      this.updateStatus('Collection Complete');
      this.logProgress();
    });
    
    EventBus.subscribe(EventTypes.BusinessExtracted, () => {
      this.businessesProcessed++;
      this.logProgress();
    });
    EventBus.subscribe(EventTypes.JobFailed, () => {
      this.businessesFailed++;
      this.logProgress();
    });
  }

  private updateStatus(newStatus: string) {
    this.status = newStatus;
    logger.info(\`Status Changed: \${this.status}\`);
  }

  private logProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = this.uniqueUrls / (elapsed / 60); 
    logger.info({
      status: this.status,
      loadedResults: this.businessesFound,
      uniqueUrls: this.uniqueUrls,
      duplicates: this.duplicates,
      scrollCount: this.currentScroll,
      elapsedSec: elapsed.toFixed(2),
      speedPerMin: speed.toFixed(2)
    }, 'Progress Update');
  }
}
`,
  'src/providers/google-maps/selectors/BusinessSelectors.ts': `export const BusinessSelectors = {
  businessCardLink: 'a[href*="/maps/place/"]',
  endOfListMarker: 'span:has-text("You\\'ve reached the end of the list")'
};
`,
  'src/providers/google-maps/scroll/ResultValidator.ts': `export class ResultValidator {
  public static isValid(url: string | null | undefined): boolean {
    if (!url) return false;
    
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('google.com')) return false;
      if (!parsed.pathname.includes('/maps/place/')) return false;
      return true;
    } catch {
      return false;
    }
  }

  public static normalize(url: string): string {
    const parsed = new URL(url);
    // Remove query parameters like tracking IDs
    parsed.search = '';
    return parsed.toString();
  }
}
`,
  'src/providers/google-maps/scroll/ResultCache.ts': `export class ResultCache {
  private cache = new Set<string>();

  public add(url: string): boolean {
    if (this.cache.has(url)) {
      return false; // Duplicate
    }
    this.cache.add(url);
    return true; // Added successfully
  }

  public has(url: string): boolean {
    return this.cache.has(url);
  }

  public size(): number {
    return this.cache.size;
  }
}
`,
  'src/providers/google-maps/scroll/ResultCollector.ts': `import { Page } from 'playwright';
import { BusinessSelectors } from '../selectors/BusinessSelectors';
import { ResultValidator } from './ResultValidator';
import { ResultCache } from './ResultCache';
import { EventBus, EventTypes } from '../../../core/events/EventBus';

export class ResultCollector {
  constructor(private page: Page, private cache: ResultCache) {}

  /**
   * Scrapes currently visible cards. Only processes newly added links.
   * Playwright evaluates locators dynamically, so we fetch all hrefs.
   */
  async collectCurrentBatch(): Promise<string[]> {
    const collectedInBatch: string[] = [];
    
    // Evaluate in browser context to minimize roundtrips
    const hrefs = await this.page.evaluate((selector) => {
      const anchors = Array.from(document.querySelectorAll(selector));
      return anchors.map(a => a.getAttribute('href') || '');
    }, BusinessSelectors.businessCardLink);

    for (const rawUrl of hrefs) {
      if (ResultValidator.isValid(rawUrl)) {
        const normalizedUrl = ResultValidator.normalize(rawUrl);
        
        // Cache prevents duplicates and repetitive Event publishing
        if (this.cache.add(normalizedUrl)) {
          collectedInBatch.push(normalizedUrl);
          EventBus.publish(EventTypes.UrlCollected, { url: normalizedUrl });
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

export class InfiniteScroller {
  constructor(private page: Page, private collector: ResultCollector) {}

  async scrollUntilComplete(): Promise<void> {
    const maxResults = Number(ConfigService.get('MAX_RESULTS'));
    const scrollStep = Number(ConfigService.get('SCROLL_STEP'));
    const scrollDelay = Number(ConfigService.get('SCROLL_DELAY'));
    const maxIdleScrolls = Number(ConfigService.get('MAX_IDLE_SCROLLS'));

    let scrollCount = 0;
    let idleScrolls = 0;
    let totalCollected = 0;

    EventBus.publish(EventTypes.ScrollStarted, { time: new Date() });

    while (totalCollected < maxResults) {
      scrollCount++;
      EventBus.publish(EventTypes.ScrollProgress, { scrollCount });

      // 1. Collect currently visible items
      const newItems = await this.collector.collectCurrentBatch();
      totalCollected += newItems.length;

      if (newItems.length === 0) {
        idleScrolls++;
      } else {
        idleScrolls = 0; // Reset idle tracker when we find new items
      }

      // 2. End-of-Results Strategies
      
      // Strategy 1: Reached max requested results
      if (totalCollected >= maxResults) {
        break;
      }

      // Strategy 2: Google displays "You've reached the end of the list"
      const isEndMarkerVisible = await this.page.isVisible(BusinessSelectors.endOfListMarker);
      if (isEndMarkerVisible) {
        break;
      }

      // Strategy 3: No new businesses after X scrolls (Lazy loading stalled/finished)
      if (idleScrolls >= maxIdleScrolls) {
        break;
      }

      // 3. Scroll Down Incrementally
      // We evaluate scrolling inside the sidebar feed container.
      await this.page.evaluate((feedSelector, step) => {
        const feed = document.querySelector(feedSelector);
        if (feed) {
          feed.scrollBy(0, step);
        }
      }, SearchSelectors.resultFeed, scrollStep);

      // Wait for network/lazy load
      await this.page.waitForTimeout(scrollDelay);
    }
    
    EventBus.publish(EventTypes.CollectionCompleted, { total: totalCollected });
  }
}
`,
  'src/providers/google-maps/GoogleMapsProvider.ts': `import { BaseProvider } from '../base/BaseProvider';
import { MapsNavigator } from './navigation/MapsNavigator';
import { InfiniteScroller } from './scroll/InfiniteScroller';
import { ResultCollector } from './scroll/ResultCollector';
import { ResultCache } from './scroll/ResultCache';
import { PageManager } from '../../core/browser/PageManager';
import { BrowserContext, Page } from 'playwright';

export class GoogleMapsProvider extends BaseProvider {
  private navigator: MapsNavigator | null = null;
  private pageManager: PageManager;
  private scroller: InfiniteScroller | null = null;
  private resultCache: ResultCache;
  private page: Page | null = null;
  
  constructor(context: BrowserContext) {
    super();
    this.pageManager = new PageManager(context);
    this.resultCache = new ResultCache();
  }

  async launch(): Promise<void> {
    this.page = await this.pageManager.createPage();
    this.navigator = new MapsNavigator(this.page);
    await this.navigator.launch();
  }

  async search(keyword: string, location: string): Promise<void> {
    if (!this.navigator) throw new Error("Navigator not initialized");
    await this.navigator.search(keyword, location);
    await this.navigator.waitForResults();
  }

  async collectUrls(): Promise<string[]> {
    if (!this.page) throw new Error("Browser page not initialized");
    
    const collector = new ResultCollector(this.page, this.resultCache);
    this.scroller = new InfiniteScroller(this.page, collector);
    
    await this.scroller.scrollUntilComplete();
    
    // We can extract everything the cache caught. 
    // Since cache is a Set, we need to convert it to array.
    // However, the cache is private to the class, so we can expose a getter or just use the event system.
    // But BaseProvider requires us to return string[].
    // Let's modify cache to expose entries
    // For now, since cache is local to this run, we can just hack it or modify ResultCache.
    return (this.resultCache as any).cache ? Array.from((this.resultCache as any).cache) : [];
  }

  async extract(url: string): Promise<any> {
    return {}; // Stub
  }
  
  async cleanup(): Promise<void> {
    if (this.page) {
      await this.pageManager.closePage(this.page);
      this.page = null;
    }
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

async function bootstrap() {
  logger.info(\`Starting Lead Collection Platform (LeadEngine)\`);
  logger.info(\`Keyword: Resorts, Location: Kerala\`);
  
  const tracker = new ProgressTracker();
  const browserManager = BrowserFactory.createBrowserManager();
  
  try {
    const browser = await browserManager.initialize({ headless: ConfigService.get('HEADLESS') === 'true' });
    const contextManager = new BrowserContextManager(browser);
    const context = await contextManager.createContext();
    
    // Test Milestone 5
    const mapsProvider = new GoogleMapsProvider(context);
    
    // 1. Launch
    await mapsProvider.launch();
    
    // 2. Search & Wait
    await mapsProvider.search("Resorts", "Kerala");
    
    // 3. Scroll & Collect
    const collectedUrls = await mapsProvider.collectUrls();
    
    logger.info("Collection Complete");
    logger.info(\`Unique URLs: \${collectedUrls.length}\`);
    
    // Clean up provider
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
