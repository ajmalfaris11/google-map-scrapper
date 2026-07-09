import { Page, BrowserContext } from 'playwright';

export class PageManager {
  constructor(private context: BrowserContext) {}

  async createPage(): Promise<Page> {
    const page = await this.context.newPage();
    
    // Block heavy resources to save proxy bandwidth and speed up scraping
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    return page;
  }

  async closePage(page: Page): Promise<void> {
    if (!page.isClosed()) {
      await page.close();
    }
  }
}
