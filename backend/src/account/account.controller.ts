import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountService } from './account.service';

type AuthRequest = Request & { user: { id: string } };

@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private service: AccountService) {}
  @Get('bookings') bookings(@Req() req: AuthRequest) {
    return this.service.bookings(req.user.id);
  }
  @Get('bookings/:id/contract') contract(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.service.contract(req.user.id, id);
  }
}
