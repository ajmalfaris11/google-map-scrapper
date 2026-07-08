import prisma from '@lead-platform/database';
import { logger } from '../logger/Logger';

export class JobLogger {
  constructor(private jobId: string) {}

  async info(message: string) {
    logger.info({ jobId: this.jobId }, message);
    await this.save('INFO', message);
  }

  async warn(message: string) {
    logger.warn({ jobId: this.jobId }, message);
    await this.save('WARN', message);
  }

  async error(message: string) {
    logger.error({ jobId: this.jobId }, message);
    await this.save('ERROR', message);
  }

  private async save(level: string, message: string) {
    try {
      await prisma.jobLog.create({
        data: {
          jobId: this.jobId,
          level,
          message,
        },
      });
    } catch (e) {
      // Don't crash the engine if log fails
      logger.error({ err: e }, 'Failed to save job log to DB');
    }
  }
}
