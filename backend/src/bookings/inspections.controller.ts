import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InspectionType, Role } from '@prisma/client';
import type { Request } from 'express';
import { InspectionsService } from './inspections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

type AuthenticatedRequest = Request & { user: { id: string; role: Role } };

@Controller('bookings')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.OWNER)
  @Post(':id/inspections')
  async createInspection(
    @Param('id') bookingId: string,
    @Req() req: AuthenticatedRequest,
    @Body()
    dto: {
      type: InspectionType;
      odometer: number;
      fuelLevel: number;
      frontImageUrl?: string;
      backImageUrl?: string;
      leftImageUrl?: string;
      rightImageUrl?: string;
      notes?: string;
    },
  ) {
    return this.inspectionsService.createInspection(
      bookingId,
      req.user.id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/inspections')
  async getInspections(@Param('id') bookingId: string) {
    return this.inspectionsService.getInspections(bookingId);
  }
}
