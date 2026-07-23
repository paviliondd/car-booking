import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
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
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: Role }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        phoneVerifiedAt: true,
        emailVerifiedAt: true,
        avatar: true,
        idCardNo: true,
        address: true,
        birthDate: true,
        gender: true,
        isVerifiedOwner: true,
        ownerRequestAt: true,
      },
    });

    if (!user || user.role !== payload.role) {
      throw new UnauthorizedException('Người dùng hoặc token không còn hợp lệ');
    }

    return user;
  }
}
