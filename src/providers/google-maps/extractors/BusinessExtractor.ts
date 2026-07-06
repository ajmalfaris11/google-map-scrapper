import { Page } from 'playwright';
import { BusinessSelectors } from '../selectors/BusinessSelectors';

export class BusinessExtractor {
  constructor(private page: Page) {}

  async extractRawData(url: string): Promise<Record<string, string | null>> {
    const rawData = await this.page.evaluate(function(selectors: any) {
      const nameEl = document.querySelector(selectors.name);
      const addrEl = document.querySelector(selectors.address);
      const webEl = document.querySelector(selectors.website) as HTMLAnchorElement;
      const phoneEl = document.querySelector(selectors.phone);
      const ratingEl = document.querySelector(selectors.rating);
      const revEl = document.querySelector(selectors.reviews);
      const catEl = document.querySelector(selectors.category);
      const hoursEl = document.querySelector(selectors.hours);

      return {
        name: nameEl ? (nameEl.textContent || '').trim() : null,
        address: addrEl ? (addrEl.textContent || '').trim() : null,
        website: webEl ? (webEl.href || '').trim() : null,
        phone: phoneEl ? (phoneEl.textContent || '').trim() : null,
        rating: ratingEl ? (ratingEl.textContent || '').trim() : null,
        reviews: revEl ? (revEl.textContent || '').trim() : null,
        category: catEl ? (catEl.textContent || '').trim() : null,
        hours: hoursEl ? (hoursEl.textContent || '').trim() : null
      };
    }, BusinessSelectors);

    // Coordinate extraction from URL
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    
    return {
      ...rawData,
      url,
      latitude: match ? match[1] : null,
      longitude: match ? match[2] : null,
    };
  }
}
