const fs = require('fs');
const path = require('path');

const files = {
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
  ProviderStatus = 'ProviderStatus'
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
    
    EventBus.subscribe(EventTypes.BusinessFound, () => {
      this.updateStatus('Ready');
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

  private updateStatus(newStatus: string) {
    this.status = newStatus;
    logger.info(\`Status Changed: \${this.status}\`);
  }

  private logProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = this.businessesProcessed / (elapsed / 60); 
    logger.info({
      status: this.status,
      found: this.businessesFound,
      processed: this.businessesProcessed,
      failed: this.businessesFailed,
      elapsedSec: elapsed.toFixed(2),
      speedPerMin: speed.toFixed(2)
    }, 'Progress Update');
  }
}
`,
  'src/providers/google-maps/selectors/CommonSelectors.ts': `export const CommonSelectors = {
  mapsUrl: 'https://www.google.com/maps',
  consentButton: 'button[aria-label="Accept all"], button.VfPpkd-LgbsSe',
  appLoadIndicator: '#app-container'
};
`,
  'src/providers/google-maps/selectors/SearchSelectors.ts': `export const SearchSelectors = {
  searchBox: 'input#searchboxinput',
  searchButton: 'button#searchbox-searchbutton',
  resultFeed: 'div[role="feed"]',
  noResultsContent: '.Q2vNVc, .D29CYb',
  captchaFrame: 'iframe[src*="recaptcha"]'
};
`,
  'src/providers/google-maps/navigation/MapsNavigator.ts': `import { Page } from 'playwright';
import { CommonSelectors } from '../selectors/CommonSelectors';
import { SearchSelectors } from '../selectors/SearchSelectors';
import { RetryService } from '../../../core/retry/RetryService';
import { EventBus, EventTypes } from '../../../core/events/EventBus';
import { NavigationError } from '../../../core/errors/Errors';
import { logger } from '../../../core/logger/Logger';
import { ConfigService } from '../../../config/ConfigService';

export class MapsNavigator {
  constructor(private page: Page) {}

  async launch(): Promise<void> {
    await RetryService.withRetry(async () => {
      try {
        const timeout = Number(ConfigService.get('PAGE_TIMEOUT') || 30000);
        await this.page.goto(CommonSelectors.mapsUrl, { waitUntil: 'domcontentloaded', timeout });
        
        // Wait for core application UI to mount, which indicates Maps loaded
        await this.page.waitForSelector(SearchSelectors.searchBox, { timeout });
        EventBus.publish(EventTypes.MapsLoaded, { time: new Date() });
      } catch (e: any) {
        EventBus.publish(EventTypes.NavigationFailed, { error: e });
        throw new NavigationError(\`Failed to launch maps: \${e.message}\`);
      }
    });
  }

  async search(keyword: string, location: string): Promise<void> {
    await RetryService.withRetry(async () => {
      try {
        EventBus.publish(EventTypes.SearchStarted, { keyword, location });
        
        const query = \`\${keyword} in \${location}\`;
        await this.page.fill(SearchSelectors.searchBox, '');
        await this.page.fill(SearchSelectors.searchBox, query);
        
        // Press enter to trigger search robustly
        await this.page.keyboard.press('Enter');
      } catch (e: any) {
        EventBus.publish(EventTypes.NavigationFailed, { error: e });
        throw new NavigationError(\`Failed to execute search: \${e.message}\`);
      }
    });
  }

  async waitForResults(): Promise<void> {
    await RetryService.withRetry(async () => {
      try {
        const timeout = Number(ConfigService.get('PAGE_TIMEOUT') || 30000);
        
        // Race between results loading, no results, or captcha
        const resultOrError = await Promise.race([
          this.page.waitForSelector(SearchSelectors.resultFeed, { state: 'visible', timeout }),
          this.page.waitForSelector(SearchSelectors.noResultsContent, { state: 'visible', timeout }).then(() => 'NO_RESULTS'),
          this.page.waitForSelector(SearchSelectors.captchaFrame, { state: 'visible', timeout }).then(() => 'CAPTCHA')
        ]);
        
        if (resultOrError === 'NO_RESULTS') {
          throw new Error('No results found for search query.');
        } else if (resultOrError === 'CAPTCHA') {
          throw new Error('Captcha detected. Manual intervention or proxy required.');
        }

        // Delay slightly after feed appears to ensure network settles
        await this.page.waitForTimeout(2000); 
        EventBus.publish(EventTypes.SearchCompleted, { time: new Date() });
        
      } catch (e: any) {
        throw new NavigationError(\`Wait for results failed: \${e.message}\`);
      }
    });
  }
}
`,
  'src/providers/google-maps/GoogleMapsProvider.ts': `import { BaseProvider } from '../base/BaseProvider';
import { MapsNavigator } from './navigation/MapsNavigator';
import { PageManager } from '../../core/browser/PageManager';
import { BrowserContext } from 'playwright';

export class GoogleMapsProvider extends BaseProvider {
  private navigator: MapsNavigator | null = null;
  private pageManager: PageManager;
  
  constructor(context: BrowserContext) {
    super();
    this.pageManager = new PageManager(context);
  }

  async launch(): Promise<void> {
    const page = await this.pageManager.createPage();
    this.navigator = new MapsNavigator(page);
    await this.navigator.launch();
  }

  async search(keyword: string, location: string): Promise<void> {
    if (!this.navigator) throw new Error("Navigator not initialized");
    await this.navigator.search(keyword, location);
    await this.navigator.waitForResults();
  }

  async collectUrls(): Promise<string[]> {
    return []; // Stub
  }
  async extract(url: string): Promise<any> {
    return {}; // Stub
  }
  async cleanup(): Promise<void> {
    // Stub
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
  logger.info(\`Headless mode: \${ConfigService.get('HEADLESS')}\`);
  
  const tracker = new ProgressTracker();
  const browserManager = BrowserFactory.createBrowserManager();
  
  try {
    const browser = await browserManager.initialize({ headless: ConfigService.get('HEADLESS') === 'true' });
    const contextManager = new BrowserContextManager(browser);
    const context = await contextManager.createContext();
    
    // Test Milestone 4
    const mapsProvider = new GoogleMapsProvider(context);
    
    // 1. Launch
    await mapsProvider.launch();
    
    // 2. Search & Wait
    await mapsProvider.search("Resorts", "Kerala");
    
    logger.info("Navigation test completed successfully. Search results rendered.");
    
    // Keep page open for 5 seconds to observe before shutting down if headless is false
    await new Promise(r => setTimeout(r, 5000));
    
  } catch (error) {
    logger.error({ err: error }, "Failed to execute navigation");
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
