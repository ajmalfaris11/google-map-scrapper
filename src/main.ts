import { ConfigService } from './config/ConfigService';
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
  logger.info(`Starting Lead Collection Platform (Persistence Engine)`);
  
  const tracker = new ProgressTracker();
  const extractionQueue = new MemoryQueue<ExtractionJob>();
  
  // 1. Recovery Flow
  const recoveryService = new RecoveryService();
  const jobRepo = new JobRepository();
  
  let jobId = await recoveryService.detectAndRecover(extractionQueue);
  
  if (!jobId) {
    const keyword = ConfigService.get('KEYWORD') as string || "Resorts";
    jobId = await jobRepo.createJob(keyword, 'google-maps', 'Kerala');
    logger.info(`Created new Job: ${jobId}`);
  }

  // 2. Persistence Flow Setup
  const persistenceService = new PersistenceService(jobId);

  EventBus.subscribe(EventTypes.BusinessExtracted, async (job: ExtractionJob) => {
    // Pass validation
    const business = job.data;
    
    // Simulate getting queue snapshot (MemoryQueue would need a snapshot method in production)
    const queueSnapshot: ExtractionJob[] = []; // await extractionQueue.getAll();
    
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
