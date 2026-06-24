import { Controller, Post, Get, Patch, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, BookingStatus } from '@prisma/client';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // 1. Tạo đặt xe mới (Public)
  @Post()
  async create(@Body() dto: CreateBookingDto) {
    return await this.bookingsService.createBooking(dto);
  }

  // 2. Tra cứu đơn hàng theo SĐT (Public)
  @Get('track')
  async track(@Query('phone') phone: string) {
    return await this.bookingsService.trackBookings(phone);
  }

  // 3. Lấy tất cả bookings (Admin/Staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  async findAll() {
    return await this.bookingsService.findAll();
  }

  // 4. Lấy chi tiết đơn đặt (Admin/Staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.bookingsService.findOne(id);
  }

  // 5. Duyệt/Cập nhật trạng thái đơn (Admin/Staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
    @Req() req: any,
  ) {
    return await this.bookingsService.updateStatus(id, status, req.user);
  }
}
