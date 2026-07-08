import { Page } from 'playwright';
import { BusinessNavigator } from '../navigation/BusinessNavigator';
import { BusinessExtractor } from './BusinessExtractor';
import { BusinessParser } from '../parsers/BusinessParser';
import { BusinessValidator } from '@lead-platform/shared';
import { EventBus, EventTypes } from '../../../core/events/EventBus';
import { logger } from '../../../core/logger/Logger';
import { BusinessModel } from '@lead-platform/types';

export class BusinessExtractionEngine {
  private navigator: BusinessNavigator;
  private extractor: BusinessExtractor;

  constructor(private page: Page, private keyword: string) {
    this.navigator = new BusinessNavigator(this.page);
    this.extractor = new BusinessExtractor(this.page);
  }

  async processUrl(url: string): Promise<BusinessModel | null> {
    const startTime = Date.now();
    try {
      // 1. Navigate directly to URL
      await this.navigator.open(url);
      
      // 2. Extract Raw DOM Data
      const rawData = await this.extractor.extractRawData(url);
      
      // 3. Parse & Normalize
      const parsedData = BusinessParser.parse(rawData, this.keyword);
      
      // 4. Validate
      const validatedData = BusinessValidator.validate(parsedData);
      
      EventBus.publish(EventTypes.BusinessExtracted, { url, timeMs: Date.now() - startTime });
      EventBus.publish(EventTypes.BusinessValidated, { name: validatedData.name });
      
      logger.info({
        name: validatedData.name,
        timeMs: Date.now() - startTime
      }, 'Successfully extracted business');
      
      return validatedData as BusinessModel;

    } catch (error: any) {
      EventBus.publish(EventTypes.BusinessFailed, { url, error: error.message });
      logger.warn({ url, error: error.message }, 'Failed to extract business');
      return null;
    }
  }
}
