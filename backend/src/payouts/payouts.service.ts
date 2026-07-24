import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutStatus } from '@prisma/client';
import { randomInt } from 'node:crypto';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async createRequest(
    userId: string,
    dto: {
      amount: number;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    },
  ) {
    if (dto.amount < 100_000) {
      throw new BadRequestException('Số tiền rút tối thiểu là 100,000 VND');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: { include: { referrer: true } } },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });
    const availableBalance = affiliate ? affiliate.balance : 0;

    if (availableBalance > 0 && dto.amount > availableBalance) {
      throw new BadRequestException(
        `Số tiền yêu cầu vượt quá số dư khả dụng hiện tại (${availableBalance.toLocaleString()} VND)`,
      );
    }

    const pendingCount = await this.prisma.payoutRequest.count({
      where: { userId, status: PayoutStatus.PENDING },
    });
    if (pendingCount > 0) {
      throw new ConflictException(
        'Bạn đang có 1 yêu cầu rút tiền chưa xử lý. Vui lòng chờ kết quả.',
      );
    }

    const requestNumber = `PAY-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomInt(1000, 9999)}`;

    return await this.prisma.payoutRequest.create({
      data: {
        requestNumber,
        userId,
        amount: dto.amount,
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountHolder: dto.accountHolder.trim(),
        status: PayoutStatus.PENDING,
      },
    });
  }

  async getMyRequests(userId: string) {
    return await this.prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForAdmin() {
    return await this.prisma.payoutRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        processedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewRequest(
    id: string,
    adminId: string,
    status: PayoutStatus,
    adminNotes?: string,
  ) {
    const request = await this.prisma.payoutRequest.findUnique({
      where: { id },
    });
    if (!request)
      throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');

    if (request.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Yêu cầu này đã được xử lý từ trước');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status,
          adminNotes: adminNotes?.trim(),
          processedById: adminId,
          processedAt: new Date(),
        },
      });

      if (
        status === PayoutStatus.COMPLETED ||
        status === PayoutStatus.APPROVED
      ) {
        const affiliate = await tx.affiliate.findUnique({
          where: { userId: request.userId },
        });
        if (affiliate && affiliate.balance >= request.amount) {
          await tx.affiliate.update({
            where: { id: affiliate.id },
            data: { balance: { decrement: request.amount } },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: `REVIEW_PAYOUT_${status}`,
          targetTable: 'PayoutRequest',
          targetId: id,
          oldValue: { status: request.status },
          newValue: { status, amount: request.amount },
        },
      });

      return updated;
    });
  }
}
