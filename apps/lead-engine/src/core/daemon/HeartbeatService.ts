import prisma from '@lead-platform/database';
import { logger } from '../logger/Logger';

export class HeartbeatService {
  private timer: NodeJS.Timeout | null = null;
  private jobId: string | null = null;

  start(jobId: string, intervalMs: number = 5000) {
    this.jobId = jobId;
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timer = setInterval(async () => {
      try {
        await prisma.job.update({
          where: { id: this.jobId! },
          data: { lastHeartbeatAt: new Date() },
        });
      } catch (error) {
        logger.error({ err: error, jobId: this.jobId }, 'Failed to send heartbeat');
      }
    }, intervalMs);
    
    logger.info({ jobId }, 'Heartbeat started');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.jobId = null;
    logger.info('Heartbeat stopped');
  }
}
