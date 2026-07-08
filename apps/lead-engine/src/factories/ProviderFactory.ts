import { BaseProvider } from '../providers/base/BaseProvider';
import { GoogleMapsProvider } from '../providers/google-maps/GoogleMapsProvider';
import { BrowserContext } from 'playwright';
import { Queue } from '@lead-platform/queue';
import { ExtractionJob } from '@lead-platform/types';

export class ProviderFactory {
  public static createProvider(type: string, context?: BrowserContext, queue?: Queue<ExtractionJob>): BaseProvider {
    if (type === 'google-maps') {
      if (!context) throw new Error("GoogleMapsProvider requires a BrowserContext.");
      if (!queue) throw new Error("GoogleMapsProvider requires a Queue.");
      return new GoogleMapsProvider(context, queue);
    }
    throw new Error(`Provider ${type} not supported.`);
  }
}
