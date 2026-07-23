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
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountService } from './account.service';
import { ChangePasswordDto, UpdateAccountProfileDto } from './dto/account.dto';

type AuthRequest = Request & { user: { id: string } };

@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private service: AccountService) {}

  @Get('profile')
  profile(@Req() req: AuthRequest) {
    return this.service.profile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateAccountProfileDto) {
    return this.service.updateProfile(req.user.id, dto);
  }

  @Post('change-password')
  changePassword(@Req() req: AuthRequest, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(req.user.id, dto);
  }

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
