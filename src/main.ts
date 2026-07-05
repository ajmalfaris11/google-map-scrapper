import { ConfigService } from './config/ConfigService';
import { logger } from './core/logger/Logger';
import { BrowserFactory } from './core/browser/BrowserFactory';
import { BrowserContextManager } from './core/browser/BrowserContextManager';
import { GoogleMapsProvider } from './providers/google-maps/GoogleMapsProvider';
import { ProgressTracker } from './core/progress/ProgressTracker';
import { EventBus, EventTypes } from './core/events/EventBus';

async function bootstrap() {
  logger.info(`Starting Lead Collection Platform (LeadEngine)`);
  logger.info(`Keyword: Resorts, Location: Kerala`);
  logger.info(`Headless mode: ${ConfigService.get('HEADLESS')}`);
  
  const tracker = new ProgressTracker();
  const browserManager = BrowserFactory.createBrowserManager();
  
  try {
    const browser = await browserManager.initialize({ headless: ConfigService.get('HEADLESS') === 'true' });
    const contextManager = new BrowserContextManager(browser);
    const context = await contextManager.createContext();
    
    // Test Milestone 4
    const mapsProvider = new GoogleMapsProvider(context);
    
    // 1. Launch
    await mapsProvider.launch();
    
    // 2. Search & Wait
    await mapsProvider.search("Resorts", "Kerala");
    
    logger.info("Navigation test completed successfully. Search results rendered.");
    
    // Keep page open for 5 seconds to observe before shutting down if headless is false
    await new Promise(r => setTimeout(r, 5000));
    
  } catch (error) {
    logger.error({ err: error }, "Failed to execute navigation");
    EventBus.publish(EventTypes.JobFailed, { error });
  } finally {
    await browserManager.closeBrowser();
    logger.info("Graceful shutdown complete.");
  }
}

bootstrap();
