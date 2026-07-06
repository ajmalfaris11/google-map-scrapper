import { Page } from 'playwright';
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
