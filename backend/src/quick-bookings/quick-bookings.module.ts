import { Module } from '@nestjs/common';
import { QuickBookingsController } from './quick-bookings.controller';
import { QuickBookingsService } from './quick-bookings.service';

@Module({
  controllers: [QuickBookingsController],
  providers: [QuickBookingsService],
})
export class QuickBookingsModule {}
