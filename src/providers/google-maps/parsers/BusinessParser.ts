import { BusinessModel } from '../../../models/Business';
import { BusinessNormalizer } from './BusinessNormalizer';

export class BusinessParser {
  public static parse(rawData: Record<string, string | null>, keyword: string): Partial<BusinessModel> {
    const parseNumber = (val: string | null) => {
      if (!val) return null;
      const num = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : num;
    };

    return {
      provider: 'google-maps',
      keyword,
      name: BusinessNormalizer.normalizeWhitespace(rawData.name) || 'Unknown',
      address: BusinessNormalizer.normalizeWhitespace(rawData.address) || undefined,
      phone: BusinessNormalizer.normalizePhone(rawData.phone) || undefined,
      website: BusinessNormalizer.normalizeWebsite(rawData.website) || undefined,
      category: BusinessNormalizer.normalizeWhitespace(rawData.category) || undefined,
      rating: parseNumber(rawData.rating) || undefined,
      reviewCount: parseNumber(rawData.reviews) || undefined,
      latitude: parseNumber(rawData.latitude) || undefined,
      longitude: parseNumber(rawData.longitude) || undefined,
      openingHours: BusinessNormalizer.normalizeWhitespace(rawData.hours) || undefined,
      googleMapsUrl: rawData.url || undefined,
      status: 'ACTIVE'
    };
  }
}
