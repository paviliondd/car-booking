import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardService } from './dashboard.service';
import {
  DashboardController,
  NotificationsController,
} from './dashboard.controller';

@Module({
  imports: [PrismaModule],
  providers: [DashboardService],
  controllers: [DashboardController, NotificationsController],
})
export class DashboardModule {}
