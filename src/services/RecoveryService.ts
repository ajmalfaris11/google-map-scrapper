import { JobRepository } from '../repositories/JobRepository';
import { CheckpointRepository } from '../repositories/CheckpointRepository';
import { Queue } from '../core/queue/Queue';
import { ExtractionJob, JobStatus } from '../models/ExtractionJob';
import { EventBus, EventTypes } from '../core/events/EventBus';
import { logger } from '../core/logger/Logger';

export class RecoveryService {
  private jobRepo = new JobRepository();
  private checkpointRepo = new CheckpointRepository();

  async detectAndRecover(queue: Queue<ExtractionJob>): Promise<string | null> {
    logger.info("Checking for interrupted jobs...");
    const unfinishedJobs = await this.jobRepo.getUnfinishedJobs();

    if (unfinishedJobs.length === 0) {
      logger.info("No interrupted jobs found. Clean state.");
      return null;
    }

    // Recover the first unfinished job (in a robust system, you'd handle multiple)
    const activeJob = unfinishedJobs[0];
    logger.warn(`Found interrupted Job ${activeJob.id}. Attempting Recovery...`);
    EventBus.publish(EventTypes.RecoveryStarted, { jobId: activeJob.id });

    const latestCheckpoint = await this.checkpointRepo.getLatestCheckpoint(activeJob.id);
    
    if (latestCheckpoint && latestCheckpoint.queueSnapshot) {
      const snapshot: ExtractionJob[] = latestCheckpoint.queueSnapshot as any;
      logger.info(`Restoring ${snapshot.length} items from checkpoint into queue...`);
      
      for (const job of snapshot) {
        // Reset processing jobs back to QUEUED
        if (job.status === JobStatus.PROCESSING) {
          job.status = JobStatus.QUEUED;
        }
        await queue.enqueue(job);
      }
      
      logger.info("Queue successfully restored from checkpoint.");
    } else {
      logger.info("No checkpoint found for job. Will restart from beginning.");
    }

    EventBus.publish(EventTypes.RecoveryCompleted, { jobId: activeJob.id });
    return activeJob.id;
  }
}
