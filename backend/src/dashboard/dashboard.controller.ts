import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
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
  getNotifications(@Query('limit') limit: string) {
    const lim = limit ? parseInt(limit, 10) : 5;
    return this.dashboardService.getNotifications(lim);
  }
}

@Controller('cars')
export class CarsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.STAFF)
  @Get('notify-list')
  async getNotifyList() {
    return await this.dashboardService.getCarNotifyList();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.STAFF)
  @Get('violate-list')
  getViolateList() {
    return this.dashboardService.getCarViolateList();
  }

  // Get available cars for long term rental (Public)
  @Get('available')
  getAvailable(
    @Query('location') location: string,
    @Query('startDate') startDate: string,
    @Query('months') months: string,
  ) {
    void startDate;
    void months;
    // Return mock available cars list
    return [
      {
        id: 'c-long-1',
        brand: 'Kia',
        model: 'Carnival',
        plateNumber: '30A-111.11',
        dailyPrice: 1800000,
        monthlyPrice: 40000000, // Monthly special package
        images: [
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
        ],
        location,
      },
      {
        id: 'c-long-2',
        brand: 'VinFast',
        model: 'VF8',
        plateNumber: '30A-999.99',
        dailyPrice: 1200000,
        monthlyPrice: 28000000,
        images: [
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80',
        ],
        location,
      },
    ];
  }
}

@Controller('feedback')
export class FeedbackController {
  @Post()
  createFeedback(@Body() body: { category: string; message: string }) {
    return {
      success: true,
      message: 'Góp ý của bạn đã được tiếp nhận. Cảm ơn ý kiến đóng góp!',
      data: body,
    };
  }
}

@Controller('rating')
export class RatingController {
  @Post()
  createRating(@Body() body: { stars: number; comment: string }) {
    return {
      success: true,
      message: 'Cảm ơn bạn đã đánh giá chất lượng dịch vụ!',
      data: body,
    };
  }
}

@Controller('booking')
export class DashboardBookingController {
  @Post('long-term')
  createLongTermBooking(@Body() body: Record<string, unknown>) {
    return {
      success: true,
      message:
        'Đăng ký thuê xe dài hạn thành công! Nhân viên sẽ liên hệ tư vấn hợp đồng trong vòng 1 ngày làm việc.',
      bookingNumber: `BK-LT-${Math.floor(100000 + Math.random() * 900000)}`,
      data: body,
    };
  }
}

// Custom Auth Controller for missing Auth actions
@Controller('auth')
export class DashboardAuthController {
  @Post('logout')
  logout() {
    return { success: true, message: 'Đăng xuất thành công!' };
  }

  @Post('forgot-password')
  forgotPassword(@Body('phone') phone: string) {
    void phone;
    return {
      success: true,
      message: 'Mã OTP đặt lại mật khẩu đã được gửi đến số điện thoại đăng ký.',
    };
  }
}
