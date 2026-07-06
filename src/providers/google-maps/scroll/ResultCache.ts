export class ResultCache {
  private cache = new Set<string>();

  public add(url: string): boolean {
    if (this.cache.has(url)) {
      return false; // Duplicate
    }
    this.cache.add(url);
    return true; // Added successfully
  }

  public has(url: string): boolean {
    return this.cache.has(url);
  }

  public size(): number {
    return this.cache.size;
  }
}
