import { chromium, Browser, BrowserContext, Page, LaunchOptions } from 'playwright';
import { logger } from '../logger/Logger';
import { env } from '../../config/env.validator';
import path from 'path';

export class BrowserManager {
  private browser: Browser | null = null;
  private contexts: BrowserContext[] = [];

  /**
   * Initializes the browser instance.
   */
  public async initialize(options?: LaunchOptions): Promise<void> {
    if (this.browser) return;

    logger.info("Initializing BrowserManager...");
    this.browser = await chromium.launch({
      headless: env.HEADLESS === 'true',
      ...options,
    });
    logger.info("BrowserManager initialized successfully.");
  }

  /**
   * Creates a new isolated BrowserContext.
   */
  public async createContext(): Promise<BrowserContext> {
    this.ensureInitialized();
    const context = await this.browser!.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    this.contexts.push(context);
    return context;
  }

  /**
   * Creates a new Page within an existing or new context.
   */
  public async createPage(context?: BrowserContext): Promise<Page> {
    let targetContext = context;
    if (!targetContext) {
      targetContext = await this.createContext();
    }
    return targetContext.newPage();
  }

  /**
   * Takes a screenshot for debugging, typically on failure.
   */
  public async takeFailureScreenshot(page: Page, identifier: string): Promise<string> {
    const safeIdentifier = identifier.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filepath = path.join(process.cwd(), 'screenshots', 'failed', `${safeIdentifier}-${Date.now()}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    logger.error(`Saved failure screenshot to ${filepath}`);
    return filepath;
  }

  /**
   * Closes all contexts and the browser.
   */
  public async close(): Promise<void> {
    for (const ctx of this.contexts) {
      await ctx.close();
    }
    this.contexts = [];
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    logger.info("BrowserManager closed successfully.");
  }

  private ensureInitialized(): void {
    if (!this.browser) {
      throw new Error("BrowserManager is not initialized. Call initialize() first.");
    }
  }
}
