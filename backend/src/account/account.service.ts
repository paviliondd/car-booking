import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

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
