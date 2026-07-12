import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req, Query } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  getBusinesses(@Req() req: any, @Query() query: any) {
    return this.businessesService.getBusinesses(query, req.user);
  }

  @Get(':id')
  getBusiness(@Param('id') id: string) {
    return this.businessesService.getBusiness(id);
  }

  @Patch(':id')
  updateBusiness(@Param('id') id: string, @Body() body: any) {
    return this.businessesService.updateBusiness(id, body);
  }
}
