import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':bookingId')
  async getContract(@Param('bookingId') bookingId: string) {
    return await this.contractsService.getOrCreateContract(bookingId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':bookingId/sign')
  async signContract(
    @Param('bookingId') bookingId: string,
    @Body('renterSignature') renterSignature: string,
  ) {
    return await this.contractsService.signContract(bookingId, renterSignature);
  }
}
