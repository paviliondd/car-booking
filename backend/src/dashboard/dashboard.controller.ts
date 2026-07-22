import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { Request } from 'express';

type DashboardRequest = Request & { user: { id: string; role: Role } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.STAFF)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(
    @Req() req: DashboardRequest,
    @Query('period') period: string,
  ) {
    return this.dashboardService.getOverview(period || 'today', req.user);
  }

  @Get('car-status-summary')
  async getCarStatusSummary(@Req() req: DashboardRequest) {
    return this.dashboardService.getCarStatusSummary(req.user);
  }

  @Get('revenue-chart')
  async getRevenueChart(
    @Req() req: DashboardRequest,
    @Query('month') month: string,
  ) {
    return this.dashboardService.getRevenueChart(
      month || new Date().toISOString().slice(0, 7),
      req.user,
    );
  }

  @Get('top-services')
  async getTopServices(@Req() req: DashboardRequest) {
    return this.dashboardService.getTopServices(req.user);
  }

  @Get('top-cars')
  async getTopCars(
    @Req() req: DashboardRequest,
    @Query('limit') limit: string,
  ) {
    const lim = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getTopCars(lim, req.user);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.STAFF)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getNotifications(
    @Req() req: DashboardRequest,
    @Query('limit') limit: string,
  ) {
    const lim = limit ? parseInt(limit, 10) : 5;
    return this.dashboardService.getNotifications(lim, req.user);
  }
}
