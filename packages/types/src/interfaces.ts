export interface SearchResult {
  url: string;
  placeId?: string;
}

export interface BusinessData {
  provider: string;
  keyword: string;
  name: string;
  phone?: string;
  website?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  googleMapsUrl?: string;
  placeId?: string;
  status: string;
}

export interface LeadProvider {
  search(keyword: string, maxResults: number): Promise<SearchResult[]>;
}

export interface DetailExtractor {
  extract(url: string): Promise<BusinessData>;
}

export interface Exporter {
  export(data: BusinessData[]): Promise<void>;
}
