import { BrowserManager } from './BrowserManager';

export class BrowserFactory {
  public static createBrowserManager(): BrowserManager {
    return new BrowserManager();
  }
}
