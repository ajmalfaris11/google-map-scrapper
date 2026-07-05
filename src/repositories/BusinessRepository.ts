import { PrismaClient } from '@prisma/client';
import { BusinessModel } from '../models/Business';

export class BusinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: BusinessModel): Promise<BusinessModel> {
    return this.prisma.business.create({ data: data as any }) as unknown as BusinessModel;
  }

  async exists(url: string): Promise<boolean> {
    const count = await this.prisma.business.count({ where: { googleMapsUrl: url } });
    return count > 0;
  }
}
