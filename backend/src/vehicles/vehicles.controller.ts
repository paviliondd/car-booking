import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, SearchVehicleDto } from './dto/vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, VehicleStatus } from '@prisma/client';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // 1. Tìm các xe trống theo lịch thuê (Public)
  @Get('search')
  async search(@Query() query: SearchVehicleDto) {
    const { startDate, endDate, brand, seats } = query;
    return await this.vehiclesService.findAvailable(startDate, endDate, { brand, seats });
  }

  // 2. Lấy gợi ý xe thay thế nếu xe hiện tại bị bận (Public)
  @Get('suggestions')
  async getSuggestions(
    @Query('brand') brand: string,
    @Query('seats') seats: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.vehiclesService.findSuggestions(
      brand || '',
      seats ? parseInt(seats, 10) : 4,
      startDate,
      endDate,
    );
  }

  // 3. Lấy thông tin lịch bận của một xe (Public)
  @Get(':id/calendar')
  async getCalendar(@Param('id') id: string) {
    return await this.vehiclesService.getCalendar(id);
  }

  // 4. Lấy chi tiết một xe (Public)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.vehiclesService.findOne(id);
  }

  // 5. Lấy tất cả xe (Public)
  @Get()
  async findAll(@Query('brand') brand?: string, @Query('seats') seats?: string) {
    return await this.vehiclesService.findAll({
      brand,
      seats: seats ? parseInt(seats, 10) : undefined,
    });
  }

  // 6. Thêm xe mới (Admin/Staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  async create(@Body() dto: CreateVehicleDto) {
    return await this.vehiclesService.create(dto);
  }

  // 7. Cập nhật xe (Admin/Staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateVehicleDto>) {
    return await this.vehiclesService.update(id, dto);
  }

  // 8. Cập nhật trạng thái xe (Admin/Staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: VehicleStatus) {
    return await this.vehiclesService.updateStatus(id, status);
  }

  // 9. Xóa xe (Admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.vehiclesService.delete(id);
  }
}
