export interface BusinessModel {
  id?: string;
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
  lastScrapedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
