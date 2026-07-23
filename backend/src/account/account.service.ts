import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, UpdateAccountProfileDto } from './dto/account.dto';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
        ownerApplications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      phone: user.phone,
      phoneVerifiedAt: user.phoneVerifiedAt,
      avatar: user.avatar,
      role: user.role,
      isVerifiedOwner: user.isVerifiedOwner,
      createdAt: user.createdAt,
      birthDate: user.birthDate,
      gender: user.gender,
      address: user.address,
      idCardNo: user.customer?.idCardNo || user.idCardNo,
      documents: {
        idCardFront: user.customer?.idCardFront || null,
        idCardBack: user.customer?.idCardBack || null,
        driverLicense: user.customer?.driverLicense || null,
      },
      hasPassword: Boolean(user.password),
      ownerApplication: user.ownerApplications[0] || null,
    };
  }

  async updateProfile(userId: string, dto: UpdateAccountProfileDto) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });
    if (!current) throw new NotFoundException('Không tìm thấy tài khoản');

    const name = dto.name?.trim();
    const email = dto.email?.toLowerCase().trim();
    const address = dto.address?.trim();
    const idCardNo = dto.idCardNo?.trim();
    const birthDate = dto.birthDate ? new Date(dto.birthDate) : undefined;
    if (birthDate && birthDate > new Date()) {
      throw new BadRequestException('Ngày sinh không được ở tương lai');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(name ? { name } : {}),
            ...(email ? { email, emailVerifiedAt: null } : {}),
            ...(address ? { address } : {}),
            ...(birthDate ? { birthDate } : {}),
            ...(dto.gender ? { gender: dto.gender } : {}),
            ...(idCardNo ? { idCardNo } : {}),
          },
        });
        await tx.customer.upsert({
          where: { userId },
          create: {
            userId,
            phone: current.phone,
            fullName: name || current.name,
            idCardNo,
          },
          update: {
            ...(name ? { fullName: name } : {}),
            ...(idCardNo ? { idCardNo } : {}),
          },
        });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'UPDATE_OWN_PROFILE',
            targetTable: 'User',
            targetId: userId,
            oldValue: {
              name: current.name,
              email: current.email,
              birthDate: current.birthDate,
              gender: current.gender,
              address: current.address,
              idCardNo: current.customer?.idCardNo || current.idCardNo,
            },
            newValue: {
              name,
              email,
              birthDate,
              gender: dto.gender,
              address,
              idCardNo,
            },
          },
        });
      });
      return this.profile(userId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email hoặc số CCCD/CMND đã thuộc tài khoản khác',
        );
      }
      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    if (
      !user.password ||
      !(await bcrypt.compare(dto.currentPassword, user.password))
    ) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }
    if (await bcrypt.compare(dto.newPassword, user.password)) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: await bcrypt.hash(dto.newPassword, 12) },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: 'CHANGE_PASSWORD',
          targetTable: 'User',
          targetId: userId,
        },
      }),
    ]);
    return { changed: true };
  }

  async bookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { customer: { userId } },
      include: {
        vehicle: true,
        payment: true,
        contract: {
          select: { id: true, signedAt: true, pdfUrl: true, createdAt: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async contract(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customer: { userId } },
      select: {
        bookingNumber: true,
        contract: {
          select: { id: true, signedAt: true, pdfUrl: true, createdAt: true },
        },
      },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn thuê');
    return { bookingNumber: booking.bookingNumber, contract: booking.contract };
  }
}
