import { Controller, Post, Body, Get, UseGuards, Req, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return req.user;
  }

  @Post('google')
  async googleLogin(@Body() body: { email: string; name: string }) {
    return await this.authService.oauthLogin(body.email, body.name);
  }

  @Post('facebook')
  async facebookLogin(@Body() body: { email: string; name: string }) {
    return await this.authService.oauthLogin(body.email, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade-owner')
  async upgradeOwner(@Req() req: any, @Body() body: { phone: string; idCardNo: string; address: string }) {
    return await this.authService.upgradeOwner(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner-requests')
  async getOwnerRequests() {
    return await this.authService.getOwnerRequests();
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-owner/:userId')
  async verifyOwner(@Param('userId') userId: string, @Body() body: { approve: boolean }) {
    return await this.authService.verifyOwner(userId, body.approve);
  }
}
