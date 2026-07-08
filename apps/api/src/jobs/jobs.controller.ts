import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  createJob(@Req() req: Request, @Body() body: { keyword: string; location?: string; options?: any }) {
    const user = req.user as any;
    return this.jobsService.createJob(user.id, body);
  }

  @Get()
  getJobs(@Req() req: Request) {
    const user = req.user as any;
    // Admins can see all jobs, normal users see only theirs
    const userId = user.role === 'ADMIN' ? undefined : user.id;
    return this.jobsService.getJobs(userId);
  }

  @Get(':id')
  getJob(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }

  @Post(':id/cancel')
  cancelJob(@Param('id') id: string) {
    return this.jobsService.cancelJob(id);
  }

  @Post(':id/retry')
  retryJob(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.jobsService.retryJob(user.id, id);
  }
}
