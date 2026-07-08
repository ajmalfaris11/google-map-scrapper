import prisma from '../repositories/PrismaClient';

export class JobService {
  async getNextQueuedJob() {
    return prisma.job.findFirst({
      where: { status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getJobStatus(jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { status: true },
    });
    return job?.status;
  }

  async markJobRunning(jobId: string) {
    return prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING' },
    });
  }

  async markJobCompleted(jobId: string, totalFound: number) {
    return prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', totalFound },
    });
  }

  async markJobFailed(jobId: string, error: string) {
    return prisma.job.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage: error },
    });
  }

  async updateProgress(jobId: string, progress: number, processed: number) {
    return prisma.job.update({
      where: { id: jobId },
      data: { progress, processed },
    });
  }

  async log(jobId: string, message: string, level: string = 'INFO') {
    return prisma.jobLog.create({
      data: { jobId, message, level },
    });
  }
}
