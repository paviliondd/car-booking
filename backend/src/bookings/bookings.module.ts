import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { PaymentsModule } from '../payments/payments.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [VehiclesModule, PaymentsModule, StorageModule],
  providers: [BookingsService, InspectionsService],
  controllers: [BookingsController, InspectionsController],
  exports: [BookingsService, InspectionsService],
})
export class BookingsModule {}
