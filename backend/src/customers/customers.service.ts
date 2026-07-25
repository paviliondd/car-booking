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

  async delete(id: string, actorId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Không tìm thấy khách hàng với ID ${id}`);
    }

    const activeBookings = customer.bookings.filter((b) =>
      ['PENDING', 'CONFIRMED', 'RENTING'].includes(b.status),
    );

    if (activeBookings.length > 0) {
      throw new BadRequestException(
        'Không thể xóa khách hàng đang có đơn đặt xe chưa hoàn thành hoặc chưa hủy. Vui lòng xử lý đơn trước khi xóa.',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Xóa các đánh giá của khách hàng này
      await tx.review.deleteMany({
        where: { customerId: id },
      });

      // 2. Xóa các đơn hàng cũ và các liên kết phụ thuộc
      const pastBookingIds = customer.bookings.map((b) => b.id);
      if (pastBookingIds.length > 0) {
        await tx.payment.deleteMany({
          where: { bookingId: { in: pastBookingIds } },
        });
        await tx.contract.deleteMany({
          where: { bookingId: { in: pastBookingIds } },
        });
        await tx.revenue.deleteMany({
          where: { bookingId: { in: pastBookingIds } },
        });
        await tx.quickBookingRequest.updateMany({
          where: { bookingId: { in: pastBookingIds } },
          data: { bookingId: null },
        });
        await tx.booking.deleteMany({
          where: { id: { in: pastBookingIds } },
        });
      }

      // 3. Xóa Customer
      const deleted = await tx.customer.delete({
        where: { id },
      });

      // 4. Ghi Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'DELETE_CUSTOMER',
          targetTable: 'Customer',
          targetId: id,
          oldValue: {
            fullName: customer.fullName,
            phone: customer.phone,
            idCardNo: customer.idCardNo,
            segment: customer.segment,
          },
        },
      });

      return { success: true, id: deleted.id, fullName: deleted.fullName };
    });
  }
}
