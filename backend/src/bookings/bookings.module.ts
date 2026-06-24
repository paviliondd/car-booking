import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [VehiclesModule, PaymentsModule],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
