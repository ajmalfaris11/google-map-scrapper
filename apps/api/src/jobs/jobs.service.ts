import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JobsService {
  constructor(private db: DatabaseService) {}

  async createJob(data: { keyword: string; location?: string; options?: any; userId: string }) {
    const maxResults = data.options?.maxResults || 10;
    
    // Check wallet balance
    const wallet = await this.db.wallet.findUnique({
      where: { userId: data.userId }
    });
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    
    if (wallet.balance < maxResults) {
      throw new Error(`Insufficient tokens. You need ${maxResults} tokens but have ${wallet.balance}.`);
    }

    // Upfront deduction
    await this.db.$transaction([
      this.db.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: maxResults } }
      }),
      this.db.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -maxResults,
          type: 'JOB_UPFRONT_DEDUCTION',
          description: `Upfront deduction for ${maxResults} leads (Job: ${data.keyword})`
        }
      })
    ]);

    return this.db.job.create({
      data: {
        keyword: data.keyword,
        provider: 'google-maps',
        location: data.location,
        options: data.options || {},
        status: 'QUEUED',
        userId: data.userId
      },
    });
  }

  async getJobs() {
    return this.db.job.findMany({
      orderBy: { createdAt: 'desc' },
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
      data: { status: 'CANCELLED' },
    });
  }

  async pauseJob(id: string) {
    return this.db.job.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
  }

  async resumeJob(id: string) {
    return this.db.job.update({
      where: { id },
      data: { status: 'QUEUED' },
    });
  }

  async retryJob(id: string) {
    const oldJob = await this.db.job.findUnique({ where: { id } });
    if (!oldJob) throw new NotFoundException('Job not found');

    return this.db.job.create({
      data: {
        keyword: oldJob.keyword,
        provider: oldJob.provider || 'google-maps',
        location: oldJob.location,
        options: oldJob.options || {},
        status: 'QUEUED',
      },
    });
  }

  async getOverviewStats() {
    const totalLeads = await this.db.business.count();
    const activeJobs = await this.db.job.count({ where: { status: 'RUNNING' } });
    
    const completed = await this.db.job.count({ where: { status: 'COMPLETED' } });
    const failed = await this.db.job.count({ where: { status: 'FAILED' } });
    const successRate = (completed + failed) > 0 ? (completed / (completed + failed)) * 100 : 100;

    return {
      totalLeads,
      activeJobs,
      successRate: parseFloat(successRate.toFixed(1)),
      totalLeadsTrend: 12, // Mock for now
      successRateTrend: 1.5, // Mock for now
    };
  }
}
