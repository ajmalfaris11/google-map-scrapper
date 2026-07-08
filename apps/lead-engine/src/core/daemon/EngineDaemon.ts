import prisma from '@lead-platform/database';
import { JobPoller } from './JobPoller';
import { JobExecutor } from './JobExecutor';
import { HeartbeatService } from './HeartbeatService';
import { logger } from '../logger/Logger';

export class EngineDaemon {
  private poller = new JobPoller();
  private executor = new JobExecutor();
  private heartbeat = new HeartbeatService();
  private isRunning = false;

  async start() {
    logger.info('Starting Lead Engine Daemon...');
    this.isRunning = true;
    
    // Recovery on start: Mark any RUNNING jobs without a recent heartbeat as FAILED
    await this.cleanupStaleJobs();

    this.loop();
  }

  stop() {
    this.isRunning = false;
    logger.info('Engine Daemon stop requested.');
  }

  private async loop() {
    if (!this.isRunning) return;

    try {
      const job = await this.poller.getNextJob();
      
      if (job) {
        const claimed = await this.poller.markJobRunning(job.id);
        if (claimed) {
          logger.info({ jobId: job.id }, 'Claimed job');
          
          this.heartbeat.start(job.id, 5000);
          
          const success = await this.executor.execute(job);
          
          this.heartbeat.stop();
          
          // Current status might be CANCELLED if user aborted it
          const currentJob = await prisma.job.findUnique({ where: { id: job.id } });
          
          if (currentJob?.status !== 'CANCELLED') {
            await prisma.job.update({
              where: { id: job.id },
              data: {
                status: success ? 'COMPLETED' : 'FAILED',
                completedAt: success ? new Date() : null,
              },
            });
            logger.info({ jobId: job.id }, `Job finished with status: ${success ? 'COMPLETED' : 'FAILED'}`);
          }
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Daemon loop error');
    }

    // Recursive timeout
    if (this.isRunning) {
      setTimeout(() => this.loop(), 3000);
    }
  }

  private async cleanupStaleJobs() {
    // If a job is RUNNING but heartbeat is > 5 minutes old, assume the engine crashed
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
    
    const staleJobs = await prisma.job.updateMany({
      where: {
        status: 'RUNNING',
        lastHeartbeatAt: { lt: staleThreshold }
      },
      data: {
        status: 'FAILED',
        errorMessage: 'Engine crashed (Heartbeat timeout)'
      }
    });

    if (staleJobs.count > 0) {
      logger.warn(`Cleaned up ${staleJobs.count} stale jobs that were stuck in RUNNING state.`);
    }
  }
}
