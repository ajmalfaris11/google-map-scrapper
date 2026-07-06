import prisma from '../repositories/PrismaClient';
import { BusinessRepository } from '../repositories/BusinessRepository';
import { CheckpointRepository, CheckpointData } from '../repositories/CheckpointRepository';
import { BusinessModel } from '../models/Business';
import { EventBus, EventTypes } from '../core/events/EventBus';
import { logger } from '../core/logger/Logger';

export class PersistenceService {
  private businessRepo = new BusinessRepository();
  private checkpointRepo = new CheckpointRepository();
  private batch: BusinessModel[] = [];
  private batchSize = 25;

  constructor(private jobId: string) {}

  async queueForSave(business: BusinessModel, checkpointContext: Omit<CheckpointData, 'jobId'>): Promise<void> {
    this.batch.push(business);

    if (this.batch.length >= this.batchSize) {
      await this.flush(checkpointContext);
    }
  }

  async flush(checkpointContext: Omit<CheckpointData, 'jobId'>): Promise<void> {
    if (this.batch.length === 0) return;

    const businessesToSave = [...this.batch];
    this.batch = [];

    const startTime = Date.now();
    try {
      // Must occur in a single Prisma transaction!
      await prisma.$transaction(async (tx) => {
        await this.businessRepo.saveBatch(businessesToSave, this.jobId, tx);
        await this.checkpointRepo.save({ ...checkpointContext, jobId: this.jobId }, tx);
      });

      EventBus.publish(EventTypes.BusinessSaved, { count: businessesToSave.length, timeMs: Date.now() - startTime });
      logger.info(`Successfully persisted batch of ${businessesToSave.length} and created checkpoint in ${Date.now() - startTime}ms`);
      
    } catch (error: any) {
      logger.error({ err: error }, "Transaction failed, batch rejected.");
      // Repush to batch or handle failure logic
      this.batch.unshift(...businessesToSave); 
      throw error;
    }
  }
}
