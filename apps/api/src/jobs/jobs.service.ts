import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JobsService {
  constructor(private db: DatabaseService) {}

  async createJob(userId: string, data: { keyword: string; location?: string; options?: any }) {
    return this.db.job.create({
      data: {
        userId,
        keyword: data.keyword,
        location: data.location,
        options: data.options || {},
        status: 'QUEUED',
      },
    });
  }

  async getJobs(userId?: string) {
    return this.db.job.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    });
  }

  async getJobById(id: string) {
    const job = await this.db.job.findUnique({
      where: { id },
      include: {
        businesses: {
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async cancelJob(id: string) {
    return this.db.job.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
  async retryJob(userId: string, id: string) {
    const oldJob = await this.db.job.findUnique({ where: { id } });
    if (!oldJob) throw new NotFoundException('Job not found');

    return this.db.job.create({
      data: {
        userId: userId || null,
        keyword: oldJob.keyword,
        location: oldJob.location,
        options: oldJob.options || {},
        status: 'QUEUED',
      },
    });
  }
}
