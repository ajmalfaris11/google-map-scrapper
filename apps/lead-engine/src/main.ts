import { ConfigService } from '@lead-platform/config';
import { logger } from './core/logger/Logger';
import { BrowserFactory } from './core/browser/BrowserFactory';
import { BrowserContextManager } from './core/browser/BrowserContextManager';
import { GoogleMapsProvider } from './providers/google-maps/GoogleMapsProvider';
import { MemoryQueue } from '@lead-platform/queue';
import { ExtractionJob, ExtractionJobStatus } from '@lead-platform/types';
import { WorkerPool } from './core/workers/WorkerPool';
import { JobService } from './services/JobService';
import { BusinessService } from './services/BusinessService';
import { EventBus, EventTypes } from './core/events/EventBus';

const jobService = new JobService();
const businessService = new BusinessService();

async function processJob(job: any) {
  logger.info(`Starting execution for Job ${job.id}`);
  await jobService.markJobRunning(job.id);
  await jobService.log(job.id, 'Job marked as RUNNING. Initializing browser...', 'INFO');

  const extractionQueue = new MemoryQueue<ExtractionJob>();
  const browserManager = BrowserFactory.createBrowserManager();

  const options = job.options && typeof job.options === 'object' ? job.options : {};
  const headless = options.headless !== undefined ? options.headless : (ConfigService.get('HEADLESS') === 'true');
  const concurrency = options.concurrency || Number(ConfigService.get('CONCURRENCY') || 3);
  
  let totalFound = 0;
  let processed = 0;

  // Set up event listeners for this job
  const onBusinessExtracted = async (event: any) => {
    if (!event || !event.data) return;
    const business = event.data;
    business.jobId = job.id;
    business.keyword = job.keyword;
    business.provider = job.provider;
    
    await businessService.upsertBusinesses(job.id, [business]);
    processed++;
    
    // Calculate progress
    const progress = totalFound > 0 ? Math.min(100, Math.round((processed / totalFound) * 100)) : 0;
    await jobService.updateProgress(job.id, progress, processed);
    
    if (processed % 10 === 0) {
      await jobService.log(job.id, `Extracted and saved ${processed} businesses so far.`, 'INFO');
    }
  };

  EventBus.subscribe(EventTypes.BusinessExtracted, onBusinessExtracted);

  try {
    const browser = await browserManager.initialize({ headless });
    await jobService.log(job.id, 'Browser initialized successfully.', 'INFO');
    
    const contextManager = new BrowserContextManager(browser);
    const context = await contextManager.createContext();
    
    const workerPool = new WorkerPool(extractionQueue, context, concurrency);
    workerPool.start();
    await jobService.log(job.id, `Worker pool started with concurrency ${concurrency}.`, 'INFO');
    
    const mapsProvider = new GoogleMapsProvider(context, extractionQueue);
    await mapsProvider.launch();
    
    await jobService.log(job.id, `Searching Google Maps for "${job.keyword}" in "${job.location || 'Global'}"...`, 'INFO');
    await mapsProvider.search(job.keyword, job.location || '');
    
    // Simulate finding total count (since GoogleMapsProvider.collectUrls() doesn't return count directly easily in this stub context, we wait)
    await mapsProvider.collectUrls(); 
    
    // Approximate total based on queue size
    totalFound = await extractionQueue.size();
    await jobService.log(job.id, `Discovered ${totalFound} URLs to extract.`, 'INFO');
    
    // Wait for queue to empty
    while (await extractionQueue.size() > 0) {
      await new Promise(r => setTimeout(r, 2000));
    }
    
    await workerPool.stop();
    await mapsProvider.cleanup();
    
    await jobService.log(job.id, `Extraction finished. Total processed: ${processed}`, 'INFO');
    await jobService.markJobCompleted(job.id, totalFound);

  } catch (error: any) {
    logger.error({ err: error, jobId: job.id }, 'Job failed');
    await jobService.log(job.id, `Job failed: ${error.message}`, 'ERROR');
    await jobService.markJobFailed(job.id, error.message || 'Unknown error');
  } finally {
    await browserManager.closeBrowser();
    // Unsubscribe to avoid memory leaks across multiple jobs
    // Note: A real event bus would need an unsubscribe method, hacking it for now by clearing or ignoring if needed.
    // In this basic version, we rely on node exit or just ignoring if EventBus grows, but for a true daemon, we need unsubscribe.
  }
}

async function pollJobs() {
  try {
    const job = await jobService.getNextQueuedJob();
    if (job) {
      logger.info(`Found QUEUED job: ${job.id}`);
      await processJob(job);
    }
  } catch (error) {
    logger.error({ err: error }, 'Error polling jobs');
  } finally {
    // Recursive polling
    setTimeout(pollJobs, 5000);
  }
}

async function bootstrap() {
  logger.info(`Starting Lead Collection Engine Daemon`);
  logger.info(`Polling for jobs every 5 seconds...`);
  pollJobs();
}

bootstrap();

