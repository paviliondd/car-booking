import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SignContractDto } from './dto/contract.dto';

type AuthenticatedRequest = Request & { user: { id: string; role: Role } };

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':bookingId')
  async getContract(
    @Req() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.contractsService.getOrCreateContract(bookingId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':bookingId/sign')
  async signContract(
    @Param('bookingId') bookingId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SignContractDto,
  ) {
    return this.contractsService.signContract(
      bookingId,
      dto.renterSignature,
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':bookingId/owner-sign')
  async ownerSignContract(
    @Param('bookingId') bookingId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SignContractDto,
  ) {
    return this.contractsService.ownerSignContract(
      bookingId,
      dto.renterSignature,
      req.user,
    );
  }
}
