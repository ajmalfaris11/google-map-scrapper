import { Page } from 'playwright';
import { CommonSelectors } from '../selectors/CommonSelectors';
import { SearchSelectors } from '../selectors/SearchSelectors';
import { RetryService } from '../../../core/retry/RetryService';
import { EventBus, EventTypes } from '../../../core/events/EventBus';
import { NavigationError } from '../../../core/errors/Errors';
import { logger } from '../../../core/logger/Logger';
import { ConfigService } from '@lead-platform/config';

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
        throw new NavigationError(`Failed to launch maps: ${e.message}`);
      }
    });
  }

  async search(keyword: string, location: string): Promise<void> {
    await RetryService.withRetry(async () => {
      try {
        EventBus.publish(EventTypes.SearchStarted, { keyword, location });
        
        const query = `${keyword} in ${location}`;
        await this.page.fill(SearchSelectors.searchBox, '');
        await this.page.fill(SearchSelectors.searchBox, query);
        
        // Press enter to trigger search robustly
        await this.page.keyboard.press('Enter');
      } catch (e: any) {
        EventBus.publish(EventTypes.NavigationFailed, { error: e });
        throw new NavigationError(`Failed to execute search: ${e.message}`);
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
        throw new NavigationError(`Wait for results failed: ${e.message}`);
      }
    });
  }
}
