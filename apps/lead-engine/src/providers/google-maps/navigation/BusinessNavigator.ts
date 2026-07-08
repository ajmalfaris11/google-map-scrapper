import { Page } from 'playwright';
import { RetryService } from '../../../core/retry/RetryService';
import { NavigationError } from '../../../core/errors/Errors';
import { EventBus, EventTypes } from '../../../core/events/EventBus';
import { BusinessSelectors } from '../selectors/BusinessSelectors';
import { SearchSelectors } from '../selectors/SearchSelectors';
import { ConfigService } from '@lead-platform/config';

export class BusinessNavigator {
  constructor(private page: Page) {}

  async open(url: string): Promise<void> {
    await RetryService.withRetry(async () => {
      try {
        const timeout = Number(ConfigService.get('PAGE_TIMEOUT') || 30000);
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout });
        
        // Race between successful load, unavailable listing, or captcha
        const resultOrError = await Promise.race([
          this.page.waitForSelector(BusinessSelectors.name, { state: 'visible', timeout }).then(() => 'READY'),
          this.page.waitForSelector(SearchSelectors.captchaFrame, { state: 'visible', timeout }).then(() => 'CAPTCHA'),
          // Sometime maps shows "Can't find this place"
          this.page.waitForSelector(SearchSelectors.noResultsContent, { state: 'visible', timeout }).then(() => 'REMOVED')
        ]);
        
        if (resultOrError === 'CAPTCHA') {
          throw new Error('Captcha detected during extraction.');
        } else if (resultOrError === 'REMOVED') {
          throw new NavigationError('Listing has been removed or is unavailable.');
        }

        EventBus.publish(EventTypes.BusinessOpened, { url });
      } catch (e: any) {
        throw new NavigationError(`Failed to open business page: ${e.message}`);
      }
    });
  }
}
