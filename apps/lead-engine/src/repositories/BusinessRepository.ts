import prisma from './PrismaClient';
import { Prisma } from '@prisma/client';
import { BusinessModel } from '@lead-platform/types';

export class BusinessRepository {
  async saveBatch(businesses: BusinessModel[], jobId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || prisma;
    
    // We use individual upserts to prevent duplicates while avoiding Prisma createMany limitations with unique constraints
    // For extreme scaling, a raw SQL query with ON CONFLICT would be used here.
    for (const business of businesses) {
      if (!business.googleMapsUrl) continue;
      
      await client.business.upsert({
        where: {
          provider_googleMapsUrl: {
            provider: business.provider,
            googleMapsUrl: business.googleMapsUrl
          }
        },
        update: {
          name: business.name,
          address: business.address,
          phone: business.phone,
          website: business.website,
          category: business.category,
          rating: business.rating,
          reviewCount: business.reviewCount,
          latitude: business.latitude,
          longitude: business.longitude,
          openingHours: business.openingHours,
          status: 'ACTIVE'
        },
        create: {
          jobId,
          provider: business.provider,
          keyword: business.keyword,
          name: business.name,
          address: business.address,
          phone: business.phone,
          website: business.website,
          category: business.category,
          rating: business.rating,
          reviewCount: business.reviewCount,
          latitude: business.latitude,
          longitude: business.longitude,
          openingHours: business.openingHours,
          googleMapsUrl: business.googleMapsUrl,
          status: 'ACTIVE'
        }
      });
    }
  }
}
