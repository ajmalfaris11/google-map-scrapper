import { BaseProvider } from '../providers/base/BaseProvider';
import { GoogleMapsProvider } from '../providers/google-maps/GoogleMapsProvider';
import { BrowserContext } from 'playwright';

export class ProviderFactory {
  public static createProvider(type: string, context?: BrowserContext): BaseProvider {
    if (type === 'google-maps') {
      if (!context) throw new Error("GoogleMapsProvider requires a BrowserContext.");
      return new GoogleMapsProvider(context);
    }
    throw new Error(`Provider ${type} not supported.`);
  }
}
