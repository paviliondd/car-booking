import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'supersecretjwtkey987654321!',
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          idCardNo: true,
          address: true,
          isVerifiedOwner: true,
          ownerRequestAt: true,
        },
      });
      if (!user) {
        throw new UnauthorizedException('User not found or token invalid');
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        role: payload.role,
        isVerifiedOwner: payload.role === 'OWNER',
        ownerRequestAt: null,
      };
    }
  }
}
