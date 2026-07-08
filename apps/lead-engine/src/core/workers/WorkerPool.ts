import { Queue } from '@lead-platform/queue';
import { ExtractionJob, ExtractionJobStatus } from '@lead-platform/types';
import { BusinessExtractionEngine } from '../../providers/google-maps/extractors/BusinessExtractionEngine';
import { BrowserContext } from 'playwright';
import { PageManager } from '../browser/PageManager';
import { EventBus, EventTypes } from '../events/EventBus';
import { logger } from '../logger/Logger';

export class WorkerPool {
  private workers: Promise<void>[] = [];
  private isRunning = false;

  constructor(
    private queue: Queue<ExtractionJob>, 
    private context: BrowserContext,
    private concurrency: number,
    private shouldHalt?: () => boolean
  ) {}

  async start() {
    this.isRunning = true;
    for (let i = 0; i < this.concurrency; i++) {
      this.workers.push(this.runWorker(i));
    }
  }

  async stop() {
    this.isRunning = false;
    await Promise.all(this.workers);
  }

  private async runWorker(workerId: number) {
    logger.info(`Worker ${workerId} started.`);
    const pageManager = new PageManager(this.context);
    const page = await pageManager.createPage();
    
    while (this.isRunning || await this.queue.size() > 0) {
      if (this.shouldHalt && this.shouldHalt()) {
        logger.info(`Worker ${workerId} halted due to external request.`);
        break;
      }

      if (await this.queue.isPaused() && await this.queue.size() === 0) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const job = await this.queue.dequeue();
      
      if (!job) {
        // Wait and poll
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      job.status = ExtractionJobStatus.PROCESSING;
      logger.info(`Worker ${workerId} processing ${job.url}`);
      
      try {
        const engine = new BusinessExtractionEngine(page, job.keyword);
        const data = await engine.processUrl(job.url);
        
        if (data) {
          job.status = ExtractionJobStatus.VALIDATED;
          job.data = data;
          EventBus.publish(EventTypes.BusinessExtracted, job); // Repository listens to this to SAVE
        } else {
          job.status = ExtractionJobStatus.FAILED;
          job.lastError = "Extraction returned null";
        }
      } catch (err: any) {
        job.attempts++;
        job.lastError = err.message;
        if (job.attempts < 3) {
          job.status = ExtractionJobStatus.RETRYING;
          await this.queue.enqueue(job); // Retry
        } else {
          job.status = ExtractionJobStatus.FAILED_PERMANENT;
        }
        logger.error({ err, url: job.url }, `Worker ${workerId} failed to process`);
      }
    }
    
    await pageManager.closePage(page);
    logger.info(`Worker ${workerId} shutdown.`);
  }
}
