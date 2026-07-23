import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  BookingQuoteDto,
  CreateBookingDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('quote')
  async quote(@Body() dto: BookingQuoteDto) {
    return await this.bookingsService.quote(dto);
  }

  // 1. Tạo đặt xe mới (Khách hàng đã đăng nhập)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.OWNER)
  @Post()
  async create(
    @Body() dto: CreateBookingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.bookingsService.createBooking(dto, req.user);
  }

  // 2. Tra cứu đơn hàng theo SĐT (Public)
  @Get('track')
  async track(
    @Query('phone') phone: string,
    @Query('bookingCode') bookingCode: string,
  ) {
    return await this.bookingsService.trackBookings(phone, bookingCode);
  }

  // 3. Lấy tất cả bookings (Admin/Staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  async findAll() {
    return await this.bookingsService.findAll();
  }

  // 4.1. Lấy danh sách yêu cầu thuê xe của chủ xe (Owner)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Get('owner/my-requests')
  async getOwnerRequests(@Req() req: AuthenticatedRequest) {
    return await this.bookingsService.findOwnerBookings(req.user.id);
  }

  // 4.2. Lấy chi tiết đơn đặt (Admin/Staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.bookingsService.findOne(id);
  }

  // 5. Duyệt/Cập nhật trạng thái đơn (Admin/Staff/Owner)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.OWNER)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.bookingsService.updateStatus(id, dto.status, req.user);
  }
}
