import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { NotificationModule } from './notification/notification.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { CustomersModule } from './customers/customers.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    NotificationModule,
    PaymentsModule,
    AuthModule,
    VehiclesModule,
    BookingsModule,
    AnalyticsModule,
    MaintenanceModule,
    CustomersModule,
    AuditModule,
  ],
})
export class AppModule {}
