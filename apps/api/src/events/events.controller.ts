import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseService } from '../database/database.service';

@Controller('events')
export class EventsController {
  constructor(private readonly db: DatabaseService) {}

  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let interval: NodeJS.Timeout;
      
      const poll = async () => {
        try {
          // Poll for running or queued jobs and their progress
          const jobs = await this.db.job.findMany({
            where: {
              status: { in: ['QUEUED', 'RUNNING'] }
            },
            select: {
              id: true,
              status: true,
              progress: true,
              processedCount: true,
              totalFound: true,
              currentBusiness: true,
            }
          });
          
          if (jobs.length > 0) {
            subscriber.next({
              data: { jobs },
            } as MessageEvent);
          }
        } catch (e) {
          // Ignore DB errors during polling
        }
      };

      // Poll every 1 second
      interval = setInterval(poll, 1000);
      
      // Cleanup when client disconnects
      return () => {
        clearInterval(interval);
      };
    });
  }
}
