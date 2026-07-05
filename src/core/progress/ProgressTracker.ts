import { EventBus, EventTypes } from '../events/EventBus';
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
    logger.info(`Status Changed: ${this.status}`);
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
