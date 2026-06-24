import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, CustomerSegment } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll() {
    return await this.customersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.customersService.findOne(id);
  }

  @Patch(':id')
  async updateSegment(
    @Param('id') id: string,
    @Body('segment') segment: CustomerSegment,
    @Body('notes') notes?: string,
  ) {
    return await this.prismaCustomerUpdate(id, segment, notes);
  }

  private async prismaCustomerUpdate(id: string, segment: CustomerSegment, notes?: string) {
    return await this.customersService.updateSegmentAndNotes(id, segment, notes);
  }
}
