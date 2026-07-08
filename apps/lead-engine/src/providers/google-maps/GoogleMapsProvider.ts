import { BaseProvider } from '../base/BaseProvider';
import { MapsNavigator } from './navigation/MapsNavigator';
import { InfiniteScroller } from './scroll/InfiniteScroller';
import { ResultCollector } from './scroll/ResultCollector';
import { ResultCache } from './scroll/ResultCache';
import { PageManager } from '../../core/browser/PageManager';
import { BrowserContext, Page } from 'playwright';
import { Queue } from '@lead-platform/queue';
import { ExtractionJob } from '@lead-platform/types';

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
