import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return await this.analyticsService.getDashboardStats();
  }

  @Get('financial')
  async getFinancialReport() {
    return await this.analyticsService.getFinancialReport();
  }

  @Get('top-vehicles')
  async getTopVehicles() {
    return await this.analyticsService.getTopVehicles();
  }
}
