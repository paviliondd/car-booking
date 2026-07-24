import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PayoutStatus, Role } from '@prisma/client';
import type { Request } from 'express';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

type AuthenticatedRequest = Request & { user: { id: string; role: Role } };

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async createRequest(
    @Req() req: AuthenticatedRequest,
    @Body()
    dto: {
      amount: number;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    },
  ) {
    return this.payoutsService.createRequest(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-requests')
  async getMyRequests(@Req() req: AuthenticatedRequest) {
    return this.payoutsService.getMyRequests(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('admin')
  async findAllForAdmin() {
    return this.payoutsService.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch('admin/:id')
  async reviewRequest(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: { status: PayoutStatus; adminNotes?: string },
  ) {
    return this.payoutsService.reviewRequest(
      id,
      req.user.id,
      dto.status,
      dto.adminNotes,
    );
  }
}
