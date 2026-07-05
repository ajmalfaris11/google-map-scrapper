import { BaseError, NavigationError, ExtractionError, ValidationError } from '../errors/Errors';
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
          logger.warn(`Transient error encountered. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay));
        } else {
          throw error; // Unknown error, do not retry
        }
      }
    }
    throw new Error("Max retries exceeded");
  }
}
