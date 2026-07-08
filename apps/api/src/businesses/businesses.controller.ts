import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req, Query } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  getBusinesses(@Query() query: any) {
    return this.businessesService.getBusinesses(query);
  }

  @Get(':id')
  getBusiness(@Param('id') id: string) {
    return this.businessesService.getBusiness(id);
  }

  @Patch(':id')
  updateBusiness(@Param('id') id: string, @Body() body: any) {
    return this.businessesService.updateBusiness(id, body);
  }

  @Post(':id/assign')
  assignUser(@Param('id') id: string, @Body('userId') userId: string | null) {
    return this.businessesService.assignUser(id, userId);
  }

  @Post(':id/notes')
  addNote(@Req() req: Request, @Param('id') id: string, @Body('content') content: string) {
    const user = req.user as any;
    return this.businessesService.addNote(id, user.id, content);
  }
}
