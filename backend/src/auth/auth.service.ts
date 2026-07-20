import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpgradeOwnerDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  private signUser(user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  }) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được đăng ký');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const suffix = randomBytes(8).toString('hex');

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: dto.name.trim(),
          phone: dto.phone?.trim() || undefined,
          idCardNo: dto.idCardNo?.trim() || undefined,
          role: Role.CUSTOMER,
          customer: {
            create: {
              phone: dto.phone?.trim() || `PENDING-${suffix}`,
              fullName: dto.name.trim(),
              idCardNo: dto.idCardNo?.trim() || `PENDING-${suffix}`,
            },
          },
        },
        select: { id: true, email: true, name: true, role: true },
      });

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    return this.signUser(user);
  }

  async googleLogin(credential: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new ServiceUnavailableException(
        'Đăng nhập Google chưa được cấu hình. Vui lòng thử lại sau.',
      );
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(
        'Google ID token không hợp lệ hoặc đã hết hạn',
      );
    }

    if (!payload?.email || !payload.email_verified || !payload.sub) {
      throw new UnauthorizedException('Tài khoản Google chưa xác minh email');
    }

    const email = payload.email.toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const suffix = randomBytes(12).toString('hex');
      user = await this.prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
          name: payload.name?.trim() || email.split('@')[0],
          avatar: payload.picture,
          role: Role.CUSTOMER,
          customer: {
            create: {
              phone: `GOOGLE-${suffix}`,
              fullName: payload.name?.trim() || email.split('@')[0],
              idCardNo: `GOOGLE-${suffix}`,
            },
          },
        },
      });
    }

    return this.signUser(user);
  }

  async upgradeOwner(userId: string, dto: UpgradeOwnerDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone.trim(),
        idCardNo: dto.idCardNo.trim(),
        address: dto.address.trim(),
        ownerRequestAt: new Date(),
        isVerifiedOwner: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        ownerRequestAt: true,
        isVerifiedOwner: true,
      },
    });
  }

  async getOwnerRequests() {
    return this.prisma.user.findMany({
      where: { ownerRequestAt: { not: null }, isVerifiedOwner: false },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        idCardNo: true,
        address: true,
        ownerRequestAt: true,
      },
    });
  }

  async verifyOwner(userId: string, approve: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: approve
        ? { isVerifiedOwner: true, role: Role.OWNER }
        : { ownerRequestAt: null, isVerifiedOwner: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerifiedOwner: true,
        ownerRequestAt: true,
      },
    });
  }
}
