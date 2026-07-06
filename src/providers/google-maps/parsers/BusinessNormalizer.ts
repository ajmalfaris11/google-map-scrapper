export class BusinessNormalizer {
  public static normalizePhone(phone: string | null): string | null {
    if (!phone) return null;
    // Remove invisible unicode formatting characters, emojis, and icons used by Google Maps
    const cleaned = phone.replace(/[^\x20-\x7E\p{L}\p{N}+-]/gu, '');
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  public static normalizeWebsite(website: string | null): string | null {
    if (!website) return null;
    try {
      const url = new URL(website);
      // Google sometimes wraps links in google.com/url?q=...
      if (url.hostname.includes('google.com') && url.searchParams.has('q')) {
        return new URL(url.searchParams.get('q')!).toString();
      }
      return url.toString();
    } catch {
      return website.trim();
    }
  }

  public static normalizeWhitespace(text: string | null): string | null {
    if (!text) return null;
    const cleaned = text.replace(/[^\x20-\x7E\p{L}\p{N}\p{P}]/gu, ' ');
    return cleaned.replace(/\s+/g, ' ').trim();
  }
}
