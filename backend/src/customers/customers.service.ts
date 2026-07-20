import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Customer, CustomerSegment } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      include: {
        bookings: {
          where: { status: 'COMPLETED' },
          select: {
            totalPrice: true,
            startDate: true,
          },
        },
      },
    });

    return customers.map((c) => {
      const totalBookings = c.bookings.length;
      const totalRevenue = c.bookings.reduce((sum, b) => sum + b.totalPrice, 0);

      let lastRentalDate: Date | null = null;
      if (totalBookings > 0) {
        const sortedDates = c.bookings
          .map((b) => b.startDate)
          .sort((a, b) => b.getTime() - a.getTime());
        lastRentalDate = sortedDates[0];
      }

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        idCardNo: c.idCardNo,
        segment: c.segment,
        notes: c.notes,
        totalBookings,
        totalRevenue,
        lastRentalDate,
        createdAt: c.createdAt,
      };
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { vehicle: true, payment: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async updateSegmentAndNotes(
    id: string,
    segment: CustomerSegment,
    notes?: string,
  ): Promise<Customer> {
    await this.findOne(id);
    return await this.prisma.customer.update({
      where: { id },
      data: {
        segment,
        ...(notes !== undefined ? { notes } : {}),
      },
    });
  }
}
