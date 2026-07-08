import prisma from '../repositories/PrismaClient';
import { Business } from '@lead-platform/types';

export class BusinessService {
  async upsertBusinesses(jobId: string, businesses: Business[]) {
    // In a real production app, we would use a bulk upsert or raw query.
    // For this implementation, we will iterate and upsert.
    let saved = 0;
    for (const b of businesses) {
      try {
        await prisma.business.upsert({
          where: {
            provider_googleMapsUrl: {
              provider: b.provider || 'google-maps',
              googleMapsUrl: b.googleMapsUrl || '',
            },
          },
          update: {
            name: b.name,
            address: b.address,
            phone: b.phone,
            website: b.website,
            category: b.category,
            rating: b.rating,
            reviewCount: b.reviewCount,
            updatedAt: new Date(),
          },
          create: {
            jobId,
            provider: b.provider || 'google-maps',
            keyword: b.keyword || '',
            name: b.name,
            address: b.address,
            phone: b.phone,
            website: b.website,
            category: b.category,
            rating: b.rating,
            reviewCount: b.reviewCount,
            googleMapsUrl: b.googleMapsUrl,
            status: 'NEW',
          },
        });
        saved++;
      } catch (err) {
        // Log skip on duplicate without URL or other constraint failures
      }
    }
    return saved;
  }
}
