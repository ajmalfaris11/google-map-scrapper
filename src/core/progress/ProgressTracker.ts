import { EventBus, EventTypes } from '../events/EventBus';
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
    logger.info(`Status Changed: ${this.status}`);
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
