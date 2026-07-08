import prisma from '@lead-platform/database';
import { Job, JobStatus } from '@lead-platform/types';
import { logger } from '../logger/Logger';

export class JobPoller {
  /**
   * Retrieves the oldest QUEUED job
   */
  async getNextJob(): Promise<Job | null> {
    try {
      const job = await prisma.job.findFirst({
        where: { status: 'QUEUED' },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
      });
      return job as any;
    } catch (error) {
      logger.error({ err: error }, 'Error polling for jobs');
      return null;
    }
  }

  /**
   * Marks a job as RUNNING and sets startedAt
   */
  async markJobRunning(jobId: string): Promise<boolean> {
    try {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
          lastHeartbeatAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      logger.error({ err: error, jobId }, 'Failed to mark job as RUNNING');
      return false;
    }
  }
}
