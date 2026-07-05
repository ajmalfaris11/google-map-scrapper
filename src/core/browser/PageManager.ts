import { Page, BrowserContext } from 'playwright';

export class PageManager {
  constructor(private context: BrowserContext) {}

  async createPage(): Promise<Page> {
    return this.context.newPage();
  }

  async closePage(page: Page): Promise<void> {
    if (!page.isClosed()) {
      await page.close();
    }
  }
}
