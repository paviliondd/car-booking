import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateCustomerDto } from './dto/customer.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';

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
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.customersService.update(id, dto, req.user.id);
  }
}
