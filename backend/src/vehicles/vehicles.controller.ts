import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch, Req, BadRequestException } from '@nestjs/common';
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

  // 5.1. Lấy danh sách xe của tôi (Chủ xe)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Get('owner/my-cars')
  async getMyCars(@Req() req: any) {
    return await this.vehiclesService.findByOwner(req.user.id);
  }

  // 6. Thêm xe mới (Admin/Staff/Owner)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.OWNER)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateVehicleDto) {
    const ownerId = req.user.role === Role.OWNER ? req.user.id : undefined;
    return await this.vehiclesService.create(dto, ownerId);
  }

  // 7. Cập nhật xe (Admin/Staff/Owner)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.OWNER)
  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: Partial<CreateVehicleDto>) {
    if (req.user.role === Role.OWNER) {
      const car = await this.vehiclesService.findOne(id);
      if (car.ownerId !== req.user.id) {
        throw new BadRequestException('Bạn không sở hữu phương tiện này');
      }
    }
    return await this.vehiclesService.update(id, dto);
  }

  // 8. Cập nhật trạng thái xe (Admin/Staff/Owner)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.OWNER)
  @Patch(':id/status')
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: VehicleStatus) {
    if (req.user.role === Role.OWNER) {
      const car = await this.vehiclesService.findOne(id);
      if (car.ownerId !== req.user.id) {
        throw new BadRequestException('Bạn không sở hữu phương tiện này');
      }
    }
    return await this.vehiclesService.updateStatus(id, status);
  }

  // 9. Xóa xe (Admin/Owner)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    if (req.user.role === Role.OWNER) {
      const car = await this.vehiclesService.findOne(id);
      if (car.ownerId !== req.user.id) {
        throw new BadRequestException('Bạn không sở hữu phương tiện này');
      }
    }
    return await this.vehiclesService.delete(id);
  }
}
