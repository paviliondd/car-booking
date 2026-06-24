import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || Role.CUSTOMER,
        // Nếu role là CUSTOMER thì tự động tạo profile Customer liên kết
        ...(dto.role === Role.CUSTOMER || !dto.role
          ? {
              customer: {
                create: {
                  phone: dto.phone || '',
                  fullName: dto.name,
                  idCardNo: dto.idCardNo || `CCCD-${Date.now()}`,
                },
              },
            }
          : {}),
      },
      include: {
        customer: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
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

  async oauthLogin(email: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const dummyPassword = await bcrypt.hash(`OAuth-${Math.random()}`, 10);
      user = await this.prisma.user.create({
        data: {
          email,
          password: dummyPassword,
          name,
          role: Role.CUSTOMER,
          customer: {
            create: {
              phone: `0000-${Date.now()}`,
              fullName: name,
              idCardNo: `CCCD-${Date.now()}`,
            },
          },
        },
      });
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
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

  async upgradeOwner(userId: string, dto: { phone: string; idCardNo: string; address: string }) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone,
        idCardNo: dto.idCardNo,
        address: dto.address,
        ownerRequestAt: new Date(),
        isVerifiedOwner: false, // Waits for admin verification
      },
    });
  }

  async getOwnerRequests() {
    return await this.prisma.user.findMany({
      where: {
        ownerRequestAt: { not: null },
        isVerifiedOwner: false,
      },
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
    if (approve) {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          isVerifiedOwner: true,
          role: Role.OWNER,
        },
      });
    } else {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ownerRequestAt: null,
          isVerifiedOwner: false,
        },
      });
    }
  }
}
