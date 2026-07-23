import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
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
        user: c.user,
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

  async update(id: string, dto: UpdateCustomerDto, actorId: string) {
    const current = await this.findOne(id);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.customer.update({
          where: { id },
          data: dto,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
        });

        if (current.userId && (dto.fullName || dto.phone)) {
          await tx.user.update({
            where: { id: current.userId },
            data: {
              ...(dto.fullName ? { name: dto.fullName } : {}),
              ...(dto.phone ? { phone: dto.phone } : {}),
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'UPDATE_CUSTOMER',
            targetTable: 'Customer',
            targetId: id,
            oldValue: {
              fullName: current.fullName,
              phone: current.phone,
              idCardNo: current.idCardNo,
              segment: current.segment,
              notes: current.notes,
            },
            newValue: { ...dto },
          },
        });

        return updated;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Số điện thoại hoặc CCCD đã được sử dụng',
        );
      }
      throw error;
    }
  }
}
