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
import { Roles } from './decorators/roles.decorator';
import {
  GoogleLoginDto,
  LoginDto,
  OwnerApplicationDto,
  RegisterDto,
  RequestPhoneCodeDto,
  ResetPasswordDto,
  ReviewOwnerApplicationDto,
  VerifyOwnerDto,
  VerifyPhoneCodeDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './auth.service';

type AuthenticatedRequest = Request & {
  user: { id: string; role: Role };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/request-code')
  requestRegistrationCode(@Body() dto: RequestPhoneCodeDto) {
    return this.authService.requestRegistrationCode(dto.phone);
  }

  @Post('register/verify-code')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('password/request-reset-code')
  requestPasswordResetCode(@Body() dto: RequestPhoneCodeDto) {
    return this.authService.requestPasswordResetCode(dto.phone);
  }

  @Post('password/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('google')
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto.credential);
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone/request-link-code')
  requestPhoneLinkCode(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RequestPhoneCodeDto,
  ) {
    return this.authService.requestPhoneLinkCode(req.user.id, dto.phone);
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone/verify-link-code')
  verifyPhoneLinkCode(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyPhoneCodeDto,
  ) {
    return this.authService.verifyPhoneLinkCode(
      req.user.id,
      dto.phone,
      dto.code,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.OWNER)
  @Get('owner-application')
  getMyOwnerApplication(@Req() req: AuthenticatedRequest) {
    return this.authService.getMyOwnerApplication(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @Post('owner-applications')
  createOwnerApplication(
    @Req() req: AuthenticatedRequest,
    @Body() dto: OwnerApplicationDto,
  ) {
    return this.authService.createOwnerApplication(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('owner-requests')
  getOwnerRequests() {
    return this.authService.getOwnerRequests();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('owner-applications/:applicationId/review')
  reviewOwnerApplication(
    @Req() req: AuthenticatedRequest,
    @Param('applicationId') applicationId: string,
    @Body() dto: ReviewOwnerApplicationDto,
  ) {
    return this.authService.reviewOwnerApplication(
      applicationId,
      req.user.id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('verify-owner/:userId')
  verifyOwner(@Param('userId') userId: string, @Body() dto: VerifyOwnerDto) {
    return this.authService.verifyOwner(userId, dto.approve);
  }
}
