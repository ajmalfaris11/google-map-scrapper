import { BrowserContext, Browser } from 'playwright';

export class BrowserContextManager {
  private contexts: BrowserContext[] = [];

  constructor(private browser: Browser) {}

  async createContext(): Promise<BrowserContext> {
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    this.contexts.push(context);
    return context;
  }

  async closeContext(context: BrowserContext): Promise<void> {
    await context.close();
    this.contexts = this.contexts.filter(c => c !== context);
  }

  async closeAllContexts(): Promise<void> {
    for (const ctx of this.contexts) {
      await ctx.close();
    }
    this.contexts = [];
  }
}
