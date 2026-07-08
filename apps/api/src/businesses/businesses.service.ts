import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BusinessesService {
  constructor(private readonly db: DatabaseService) {}

  async getBusinesses(query: any) {
    const { page = 1, limit = 50, status, jobId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;

    const [data, total] = await Promise.all([
      this.db.business.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.db.business.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async getBusiness(id: string) {
    const business = await this.db.business.findUnique({
      where: { id },
      include: { notes: true, tags: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async updateBusiness(id: string, data: any) {
    return this.db.business.update({
      where: { id },
      data,
    });
  }

  async assignUser(id: string, userId: string | null) {
    return this.db.business.update({
      where: { id },
      data: { assignedUserId: userId },
    });
  }

  async addNote(id: string, userId: string, content: string) {
    return this.db.businessNote.create({
      data: {
        businessId: id,
        userId,
        content,
      },
    });
  }

  async setTags(id: string, tags: string[]) {
    // For simplicity, assuming tags exist. A real system would upsert tags.
    // Assuming tags are a string array on business directly, but it's a relation.
    // Since tags are BusinessTag models, this logic would link them.
    // Simplified for now.
    return { success: true, message: 'Not fully implemented in schema yet' };
  }
}
