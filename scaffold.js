const fs = require('fs');
const path = require('path');

const files = {
  'src/config/ConfigService.ts': `import { env } from './env.validator';

export class ConfigService {
  public static get(key: keyof typeof env) {
    return env[key];
  }
}
`,
  'src/core/errors/Errors.ts': `export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NavigationError extends BaseError {}
export class ExtractionError extends BaseError {}
export class ValidationError extends BaseError {}
export class DatabaseError extends BaseError {}
export class QueueError extends BaseError {}
export class BrowserError extends BaseError {}
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
  BrowserClosed = 'BrowserClosed'
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
  'src/core/queue/Queue.ts': `export interface Queue<T> {
  enqueue(item: T): Promise<void>;
  dequeue(): Promise<T | null>;
  peek(): Promise<T | null>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  cancel(): Promise<void>;
  retry(item: T): Promise<void>;
  size(): Promise<number>;
}
`,
  'src/core/queue/MemoryQueue.ts': `import { Queue } from './Queue';

export class MemoryQueue<T> implements Queue<T> {
  private items: T[] = [];
  private isPaused = false;

  async enqueue(item: T): Promise<void> {
    this.items.push(item);
  }

  async dequeue(): Promise<T | null> {
    if (this.isPaused || this.items.length === 0) return null;
    return this.items.shift() || null;
  }

  async peek(): Promise<T | null> {
    if (this.items.length === 0) return null;
    return this.items[0];
  }

  async pause(): Promise<void> {
    this.isPaused = true;
  }

  async resume(): Promise<void> {
    this.isPaused = false;
  }

  async cancel(): Promise<void> {
    this.items = [];
  }

  async retry(item: T): Promise<void> {
    this.items.unshift(item); // Add to the front
  }

  async size(): Promise<number> {
    return this.items.length;
  }
}
`,
  'src/core/queue/QueueFactory.ts': `import { Queue } from './Queue';
import { MemoryQueue } from './MemoryQueue';

export class QueueFactory {
  public static createQueue<T>(type: 'memory' | 'redis' = 'memory'): Queue<T> {
    if (type === 'memory') {
      return new MemoryQueue<T>();
    }
    throw new Error(\`Queue type \${type} not implemented.\`);
  }
}
`,
  'src/core/browser/BrowserManager.ts': `import { Browser, chromium, LaunchOptions } from 'playwright';
import { ConfigService } from '../../config/ConfigService';
import { EventBus, EventTypes } from '../events/EventBus';

export class BrowserManager {
  private browser: Browser | null = null;

  async initialize(options?: LaunchOptions): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: ConfigService.get('HEADLESS') === 'true',
        ...options,
      });
      EventBus.publish(EventTypes.BrowserStarted, { time: new Date() });
    }
    return this.browser;
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      throw new Error("Browser not initialized.");
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      EventBus.publish(EventTypes.BrowserClosed, { time: new Date() });
    }
  }
}
`,
  'src/core/browser/BrowserContextManager.ts': `import { BrowserContext, Browser } from 'playwright';

export class BrowserContextManager {
  private contexts: BrowserContext[] = [];

  constructor(private browser: Browser) {}

  async createContext(): Promise<BrowserContext> {
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    this.contexts.push(context);
    return context;
  }

  async closeContext(context: BrowserContext): Promise<void> {
    await context.close();
    this.contexts = this.contexts.filter(c => c !== context);
  }

  async closeAllContexts(): Promise<void> {
    for (const ctx of this.contexts) {
      await ctx.close();
    }
    this.contexts = [];
  }
}
`,
  'src/core/browser/PageManager.ts': `import { Page, BrowserContext } from 'playwright';

export class PageManager {
  constructor(private context: BrowserContext) {}

  async createPage(): Promise<Page> {
    return this.context.newPage();
  }

  async closePage(page: Page): Promise<void> {
    if (!page.isClosed()) {
      await page.close();
    }
  }
}
`,
  'src/core/browser/BrowserFactory.ts': `import { BrowserManager } from './BrowserManager';

export class BrowserFactory {
  public static createBrowserManager(): BrowserManager {
    return new BrowserManager();
  }
}
`,
  'src/core/progress/ProgressTracker.ts': `import { EventBus, EventTypes } from '../events/EventBus';
import { logger } from '../logger/Logger';

export class ProgressTracker {
  private businessesFound = 0;
  private businessesProcessed = 0;
  private businessesFailed = 0;
  private businessesRetried = 0;
  private startTime: number = Date.now();

  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    EventBus.subscribe(EventTypes.BusinessFound, () => {
      this.businessesFound++;
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

  private logProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = this.businessesProcessed / (elapsed / 60); // per min
    logger.info({
      found: this.businessesFound,
      processed: this.businessesProcessed,
      failed: this.businessesFailed,
      elapsedSec: elapsed.toFixed(2),
      speedPerMin: speed.toFixed(2)
    }, 'Progress Update');
  }
}
`,
  'src/core/retry/RetryService.ts': `import { BaseError, NavigationError, ExtractionError, ValidationError } from '../errors/Errors';
import { ConfigService } from '../../config/ConfigService';
import { logger } from '../logger/Logger';

export class RetryService {
  public static async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries = Number(ConfigService.get('MAX_RETRIES'))
  ): Promise<T> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error; // Never retry validation errors
        }
        if (error instanceof NavigationError || error instanceof ExtractionError) {
          if (attempt === maxRetries) throw error;
          attempt++;
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(\`Transient error encountered. Retrying in \${delay}ms (Attempt \${attempt}/\${maxRetries})\`);
          await new Promise(res => setTimeout(res, delay));
        } else {
          throw error; // Unknown error, do not retry
        }
      }
    }
    throw new Error("Max retries exceeded");
  }
}
`,
  'src/models/Business.ts': `export interface BusinessModel {
  id?: string;
  provider: string;
  keyword: string;
  name: string;
  phone?: string;
  website?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  googleMapsUrl?: string;
  placeId?: string;
  status: string;
  lastScrapedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
`,
  'src/models/Job.ts': `export enum JobStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Paused = 'PAUSED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}

export interface JobModel {
  id?: string;
  keyword: string;
  provider: string;
  status: JobStatus;
  progress: number;
  totalFound: number;
  processed: number;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
`,
  'src/validators/BusinessValidator.ts': `import { z } from 'zod';

export const BusinessSchema = z.object({
  provider: z.string(),
  keyword: z.string(),
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal('')),
  status: z.string().default('ACTIVE'),
}).passthrough();

export class BusinessValidator {
  public static validate(data: any) {
    return BusinessSchema.parse(data);
  }
}
`,
  'src/validators/JobValidator.ts': `import { z } from 'zod';
import { JobStatus } from '../models/Job';

export const JobSchema = z.object({
  keyword: z.string().min(1),
  provider: z.string(),
  status: z.nativeEnum(JobStatus).default(JobStatus.Pending),
}).passthrough();

export class JobValidator {
  public static validate(data: any) {
    return JobSchema.parse(data);
  }
}
`,
  'src/repositories/BusinessRepository.ts': `import { PrismaClient } from '@prisma/client';
import { BusinessModel } from '../models/Business';

export class BusinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: BusinessModel): Promise<BusinessModel> {
    return this.prisma.business.create({ data: data as any }) as unknown as BusinessModel;
  }

  async exists(url: string): Promise<boolean> {
    const count = await this.prisma.business.count({ where: { googleMapsUrl: url } });
    return count > 0;
  }
}
`,
  'src/repositories/JobRepository.ts': `import { PrismaClient } from '@prisma/client';
import { JobModel, JobStatus } from '../models/Job';

export class JobRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: JobModel): Promise<JobModel> {
    return this.prisma.job.create({ data: data as any }) as unknown as JobModel;
  }

  async complete(id: string): Promise<void> {
    await this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.Completed, finishedAt: new Date() }
    });
  }
}
`,
  'src/providers/base/BaseProvider.ts': `export abstract class BaseProvider {
  abstract launch(): Promise<void>;
  abstract search(keyword: string): Promise<void>;
  abstract collectUrls(): Promise<string[]>;
  abstract extract(url: string): Promise<any>;
  abstract cleanup(): Promise<void>;
}
`,
  'src/providers/google-maps/GoogleMapsProvider.ts': `import { BaseProvider } from '../base/BaseProvider';

export class GoogleMapsProvider extends BaseProvider {
  async launch(): Promise<void> {
    // Stub
  }
  async search(keyword: string): Promise<void> {
    // Stub
  }
  async collectUrls(): Promise<string[]> {
    return [];
  }
  async extract(url: string): Promise<any> {
    return {};
  }
  async cleanup(): Promise<void> {
    // Stub
  }
}
`,
  'src/providers/google-maps/selectors/CommonSelectors.ts': `export const CommonSelectors = {};`,
  'src/providers/google-maps/selectors/SearchSelectors.ts': `export const SearchSelectors = {};`,
  'src/providers/google-maps/selectors/BusinessSelectors.ts': `export const BusinessSelectors = {};`,
  'src/providers/google-maps/navigation/MapsNavigator.ts': `export class MapsNavigator {
  async launch() {}
  async search(keyword: string) {}
  async waitForResults() {}
  async scroll() {}
  async openBusiness(url: string) {}
  async goBack() {}
}
`,
  'src/providers/google-maps/extractors/BusinessExtractor.ts': `export class BusinessExtractor {
  async extract() {}
}
`,
  'src/providers/google-maps/parsers/BusinessParser.ts': `export class BusinessParser {
  parse(rawData: any) { return {}; }
}
`,
  'src/factories/ProviderFactory.ts': `import { BaseProvider } from '../providers/base/BaseProvider';
import { GoogleMapsProvider } from '../providers/google-maps/GoogleMapsProvider';

export class ProviderFactory {
  public static createProvider(type: string): BaseProvider {
    if (type === 'google-maps') return new GoogleMapsProvider();
    throw new Error(\`Provider \${type} not supported.\`);
  }
}
`,
  'src/factories/ExporterFactory.ts': `export class ExporterFactory {
  // Stub for future exporters
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
