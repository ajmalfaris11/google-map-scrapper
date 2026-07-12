import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BusinessesService {
  constructor(private readonly db: DatabaseService) {}

  async getBusinesses(query: any, user: any) {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      jobId,
      search,
      category,
      requireEmail,
      requirePhone,
      requireWebsite,
      minRating,
      sortBy = 'recent',
      sortDir = 'desc',
      ids
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    where.AND = [];
    
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      where.job = { userId: user?.id };
    }

    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    
    if (ids) {
      where.id = { in: ids.split(',') };
    }

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (category) {
      where.category = { in: category.split(',') };
    }

    const addContactFilter = (field: string, req: string) => {
      if (req === 'yes') {
        where.AND.push({ [field]: { not: null } });
        where.AND.push({ [field]: { not: '' } });
      } else if (req === 'no') {
        where.AND.push({
          OR: [
            { [field]: null },
            { [field]: '' }
          ]
        });
      }
    };

    addContactFilter('email', requireEmail);
    addContactFilter('phone', requirePhone);
    addContactFilter('website', requireWebsite);

    if (minRating && Number(minRating) > 0) {
      where.rating = { gte: Number(minRating) };
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    let orderBy: any = { createdAt: 'desc' };
    const dir = sortDir === 'asc' ? 'asc' : 'desc';
    
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sortBy === 'recent') orderBy = { createdAt: 'desc' };
    else if (sortBy === 'name') orderBy = { name: 'desc' }; // Z-A
    else if (sortBy === 'rating') orderBy = { rating: 'asc' }; // Low-High
    else if (sortBy === 'category') orderBy = { category: dir };
    else if (sortBy === 'status') orderBy = { status: dir };

    const [data, total] = await Promise.all([
      this.db.business.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy,
      }),
      this.db.business.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getBusiness(id: string) {
    const business = await this.db.business.findUnique({
      where: { id },
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
}
