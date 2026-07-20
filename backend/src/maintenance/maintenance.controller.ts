import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  async create(
    @Body()
    body: {
      vehicleId: string;
      type: string;
      scheduledDate: string;
      description?: string;
      cost?: number;
    },
  ) {
    return await this.maintenanceService.create(body);
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string, @Body('cost') cost: number) {
    return await this.maintenanceService.complete(id, cost);
  }

  @Get('alerts')
  async getAlerts() {
    return await this.maintenanceService.getAlerts();
  }

  @Get()
  async findAll() {
    return await this.maintenanceService.findAll();
  }
}
