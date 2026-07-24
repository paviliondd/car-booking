import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';
import {
  CreateQuickBookingDto,
  ListQuickBookingsDto,
  UpdateQuickBookingDto,
} from './dto/quick-booking.dto';
import { QuickBookingsService } from './quick-bookings.service';

@Controller('quick-bookings')
export class QuickBookingsController {
  constructor(private readonly quickBookings: QuickBookingsService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateQuickBookingDto) {
    return this.quickBookings.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  list(@Query() query: ListQuickBookingsDto) {
    return this.quickBookings.list(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuickBookingDto,
  ) {
    return this.quickBookings.update(id, request.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post(':id/resend-sms')
  resendSms(@Param('id', ParseUUIDPipe) id: string) {
    return this.quickBookings.resendSms(id);
  }
}
