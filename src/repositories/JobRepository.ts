import { PrismaClient } from '@prisma/client';
import { JobModel, JobStatus } from '../models/Job';

export class JobRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: JobModel): Promise<JobModel> {
    return this.prisma.job.create({ data: data as any }) as unknown as JobModel;
  }

  async complete(id: string): Promise<void> {
    await this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.Completed, finishedAt: new Date() }
    });
  }
}
