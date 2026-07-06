const fs = require('fs');
const path = require('path');

const files = {
  'src/repositories/PrismaClient.ts': `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;
`,
  'src/repositories/BusinessRepository.ts': `import prisma from './PrismaClient';
import { Prisma } from '@prisma/client';
import { BusinessModel } from '../models/Business';

export class BusinessRepository {
  async saveBatch(businesses: BusinessModel[], jobId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || prisma;
    
    // We use individual upserts to prevent duplicates while avoiding Prisma createMany limitations with unique constraints
    // For extreme scaling, a raw SQL query with ON CONFLICT would be used here.
    for (const business of businesses) {
      if (!business.googleMapsUrl) continue;
      
      await client.business.upsert({
        where: {
          provider_googleMapsUrl: {
            provider: business.provider,
            googleMapsUrl: business.googleMapsUrl
          }
        },
        update: {
          name: business.name,
          address: business.address,
          phone: business.phone,
          website: business.website,
          category: business.category,
          rating: business.rating,
          reviewCount: business.reviewCount,
          latitude: business.latitude,
          longitude: business.longitude,
          openingHours: business.openingHours,
          status: 'ACTIVE'
        },
        create: {
          jobId,
          provider: business.provider,
          keyword: business.keyword,
          name: business.name,
          address: business.address,
          phone: business.phone,
          website: business.website,
          category: business.category,
          rating: business.rating,
          reviewCount: business.reviewCount,
          latitude: business.latitude,
          longitude: business.longitude,
          openingHours: business.openingHours,
          googleMapsUrl: business.googleMapsUrl,
          status: 'ACTIVE'
        }
      });
    }
  }
}
`,
  'src/repositories/JobRepository.ts': `import prisma from './PrismaClient';

export class JobRepository {
  async createJob(keyword: string, provider: string, location?: string): Promise<string> {
    const job = await prisma.job.create({
      data: {
        keyword,
        provider,
        location,
        status: 'RUNNING'
      }
    });
    return job.id;
  }

  async getUnfinishedJobs() {
    return prisma.job.findMany({
      where: {
        status: 'RUNNING'
      }
    });
  }

  async markComplete(jobId: string) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' }
    });
  }
}
`,
  'src/repositories/CheckpointRepository.ts': `import prisma from './PrismaClient';
import { Prisma } from '@prisma/client';

export interface CheckpointData {
  jobId: string;
  lastProcessedUrl?: string;
  processedCount: number;
  failedCount: number;
  remainingCount: number;
  queueSnapshot: any;
  workerSnapshot: any;
}

export class CheckpointRepository {
  async save(data: CheckpointData, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || prisma;
    await client.checkpoint.create({
      data: {
        jobId: data.jobId,
        lastProcessedUrl: data.lastProcessedUrl,
        processedCount: data.processedCount,
        failedCount: data.failedCount,
        remainingCount: data.remainingCount,
        queueSnapshot: data.queueSnapshot ? JSON.parse(JSON.stringify(data.queueSnapshot)) : null,
        workerSnapshot: data.workerSnapshot ? JSON.parse(JSON.stringify(data.workerSnapshot)) : null,
      }
    });
  }

  async getLatestCheckpoint(jobId: string) {
    return prisma.checkpoint.findFirst({
      where: { jobId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
`,
  'src/services/PersistenceService.ts': `import prisma from '../repositories/PrismaClient';
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
      logger.info(\`Successfully persisted batch of \${businessesToSave.length} and created checkpoint in \${Date.now() - startTime}ms\`);
      
    } catch (error: any) {
      logger.error({ err: error }, "Transaction failed, batch rejected.");
      // Repush to batch or handle failure logic
      this.batch.unshift(...businessesToSave); 
      throw error;
    }
  }
}
`,
  'src/services/RecoveryService.ts': `import { JobRepository } from '../repositories/JobRepository';
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
    logger.warn(\`Found interrupted Job \${activeJob.id}. Attempting Recovery...\`);
    EventBus.publish(EventTypes.RecoveryStarted, { jobId: activeJob.id });

    const latestCheckpoint = await this.checkpointRepo.getLatestCheckpoint(activeJob.id);
    
    if (latestCheckpoint && latestCheckpoint.queueSnapshot) {
      const snapshot: ExtractionJob[] = latestCheckpoint.queueSnapshot as any;
      logger.info(\`Restoring \${snapshot.length} items from checkpoint into queue...\`);
      
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
`,
  'src/main.ts': `import { ConfigService } from './config/ConfigService';
import { logger } from './core/logger/Logger';
import { BrowserFactory } from './core/browser/BrowserFactory';
import { BrowserContextManager } from './core/browser/BrowserContextManager';
import { GoogleMapsProvider } from './providers/google-maps/GoogleMapsProvider';
import { ProgressTracker } from './core/progress/ProgressTracker';
import { EventBus, EventTypes } from './core/events/EventBus';
import { MemoryQueue } from './core/queue/MemoryQueue';
import { ExtractionJob, JobStatus } from './models/ExtractionJob';
import { WorkerPool } from './core/workers/WorkerPool';

// Milestone 8 Imports
import { JobRepository } from './repositories/JobRepository';
import { PersistenceService } from './services/PersistenceService';
import { RecoveryService } from './services/RecoveryService';

async function bootstrap() {
  logger.info(\`Starting Lead Collection Platform (Persistence Engine)\`);
  
  const tracker = new ProgressTracker();
  const extractionQueue = new MemoryQueue<ExtractionJob>();
  
  // 1. Recovery Flow
  const recoveryService = new RecoveryService();
  const jobRepo = new JobRepository();
  
  let jobId = await recoveryService.detectAndRecover(extractionQueue);
  
  if (!jobId) {
    const keyword = ConfigService.get('KEYWORD') || "Resorts";
    jobId = await jobRepo.createJob(keyword, 'google-maps', 'Kerala');
    logger.info(\`Created new Job: \${jobId}\`);
  }

  // 2. Persistence Flow Setup
  const persistenceService = new PersistenceService(jobId);

  EventBus.subscribe(EventTypes.BusinessExtracted, async (job: ExtractionJob) => {
    // Pass validation
    const business = job.data;
    
    // Simulate getting queue snapshot (MemoryQueue would need a snapshot method in production)
    const queueSnapshot = []; // await extractionQueue.getAll();
    
    await persistenceService.queueForSave(business, {
      lastProcessedUrl: job.url,
      processedCount: 1, // Aggregated later
      failedCount: 0,
      remainingCount: 0,
      queueSnapshot: queueSnapshot,
      workerSnapshot: {}
    });
    
    job.status = JobStatus.COMPLETED;
  });

  const browserManager = BrowserFactory.createBrowserManager();
  
  try {
    const browser = await browserManager.initialize({ headless: ConfigService.get('HEADLESS') === 'true' });
    const contextManager = new BrowserContextManager(browser);
    const context = await contextManager.createContext();
    
    const concurrency = Number(ConfigService.get('CONCURRENCY') || 3);
    const workerPool = new WorkerPool(extractionQueue, context, concurrency);
    
    workerPool.start();
    
    const mapsProvider = new GoogleMapsProvider(context, extractionQueue);
    
    // Only launch discovery if we didn't fully recover a massive queue
    // (In production, Checkpoint tells us if Discovery was complete)
    await mapsProvider.launch();
    await mapsProvider.search(ConfigService.get('KEYWORD') as string, "Kerala");
    await mapsProvider.collectUrls(); 
    
    while (await extractionQueue.size() > 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Flush any remaining batch
    await persistenceService.flush({
      processedCount: 0, failedCount: 0, remainingCount: 0, queueSnapshot: [], workerSnapshot: {}
    });
    
    await jobRepo.markComplete(jobId);
    
    await workerPool.stop();
    await mapsProvider.cleanup();
    
  } catch (error) {
    logger.error({ err: error }, "Failed to execute engine");
    EventBus.publish(EventTypes.JobFailed, { error });
  } finally {
    await browserManager.closeBrowser();
    logger.info("Graceful shutdown complete.");
  }
}

bootstrap();
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created: ', filePath);
}
