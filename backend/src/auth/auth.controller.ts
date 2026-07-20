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
import { AuthService } from './auth.service';
import {
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  UpgradeOwnerDto,
  VerifyOwnerDto,
} from './dto/auth.dto';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

type AuthenticatedRequest = Request & {
  user: { id: string; role: Role };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('google')
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto.credential);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade-owner')
  async upgradeOwner(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpgradeOwnerDto,
  ) {
    return this.authService.upgradeOwner(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('owner-requests')
  async getOwnerRequests() {
    return this.authService.getOwnerRequests();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('verify-owner/:userId')
  async verifyOwner(
    @Param('userId') userId: string,
    @Body() dto: VerifyOwnerDto,
  ) {
    return this.authService.verifyOwner(userId, dto.approve);
  }
}
