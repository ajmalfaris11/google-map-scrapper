import { Browser, chromium, LaunchOptions } from 'playwright';
import { ConfigService } from '../../config/ConfigService';
import { EventBus, EventTypes } from '../events/EventBus';

export class BrowserManager {
  private browser: Browser | null = null;

  async initialize(options?: LaunchOptions): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: ConfigService.get('HEADLESS') === 'true',
        ...options,
      });
      EventBus.publish(EventTypes.BrowserStarted, { time: new Date() });
    }
    return this.browser;
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      throw new Error("Browser not initialized.");
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      EventBus.publish(EventTypes.BrowserClosed, { time: new Date() });
    }
  }
}
