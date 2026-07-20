import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardService } from './dashboard.service';
import {
  DashboardController,
  NotificationsController,
  CarsController,
  FeedbackController,
  RatingController,
  DashboardBookingController,
  DashboardAuthController,
} from './dashboard.controller';

@Module({
  imports: [PrismaModule],
  providers: [DashboardService],
  controllers: [
    DashboardController,
    NotificationsController,
    CarsController,
    FeedbackController,
    RatingController,
    DashboardBookingController,
    DashboardAuthController,
  ],
})
export class DashboardModule {}
