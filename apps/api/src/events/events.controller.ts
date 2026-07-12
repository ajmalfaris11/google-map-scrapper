import { Controller, Sse, UseGuards, Req } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly db: DatabaseService) {}

  @Sse('stream')
  streamEvents(@Req() req: any): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let interval: NodeJS.Timeout;
      
      const poll = async () => {
        try {
          // Poll for running or queued jobs and their progress
          const tenSecondsAgo = new Date(Date.now() - 10000);
          
          const whereClause: any = {
            OR: [
              { status: { in: ['QUEUED', 'RUNNING'] } },
              { status: { in: ['COMPLETED', 'FAILED'] }, updatedAt: { gte: tenSecondsAgo } }
            ]
          };

          if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
            whereClause.userId = req.user?.id;
          }

          const jobs = await this.db.job.findMany({
            where: whereClause,
            select: {
              id: true,
              status: true,
              progress: true,
              processed: true,
              totalFound: true,
              logs: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
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
