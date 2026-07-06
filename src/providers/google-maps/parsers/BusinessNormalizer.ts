export class BusinessNormalizer {
  public static normalizePhone(phone: string | null): string | null {
    if (!phone) return null;
    // Basic cleanup: remove extra spaces, standardizing could be complex based on region
    return phone.replace(/\s+/g, ' ').trim();
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
    return text.replace(/\s+/g, ' ').trim();
  }
}
