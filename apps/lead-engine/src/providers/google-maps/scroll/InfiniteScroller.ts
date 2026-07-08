import { Page } from 'playwright';
import { SearchSelectors } from '../selectors/SearchSelectors';
import { BusinessSelectors } from '../selectors/BusinessSelectors';
import { ResultCollector } from './ResultCollector';
import { ConfigService } from '@lead-platform/config';
import { EventBus, EventTypes } from '../../../core/events/EventBus';
import { Queue } from '@lead-platform/queue';
import { ExtractionJob } from '@lead-platform/types';
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
        logger.info(`Queue Backpressure triggered (Size: ${queueSize}). Pausing scroll.`);
        await this.queue.pause();
        
        // Wait until queue drains
        while (await this.queue.size() > lowWaterMark) {
          await this.page.waitForTimeout(2000);
        }
        
        logger.info(`Queue drained (Size: ${await this.queue.size()}). Resuming scroll.`);
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
