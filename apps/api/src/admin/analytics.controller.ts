import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DatabaseService } from '../database/database.service';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private db: DatabaseService) {}

  @Get()
  async getAnalytics() {
    const totalUsers = await this.db.user.count();
    const activeUsers = await this.db.user.count({ where: { isActive: true } });
    const totalJobs = await this.db.job.count();
    const completedJobs = await this.db.job.count({ where: { status: 'COMPLETED' } });
    const totalBusinesses = await this.db.business.count();

    const recentJobs = await this.db.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        keyword: true,
        provider: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      totalUsers,
      activeUsers,
      totalJobs,
      completedJobs,
      totalBusinesses,
      recentJobs,
    };
  }
}
