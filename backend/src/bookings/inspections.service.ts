import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionType } from '@prisma/client';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  async createInspection(
    bookingId: string,
    inspectorId: string,
    dto: {
      type: InspectionType;
      odometer: number;
      fuelLevel: number;
      frontImageUrl?: string;
      backImageUrl?: string;
      leftImageUrl?: string;
      rightImageUrl?: string;
      notes?: string;
    },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vehicle: true, inspections: true },
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn đặt xe');
    }

    const existingType = booking.inspections.find((i) => i.type === dto.type);
    if (existingType) {
      throw new BadRequestException(
        `Đơn đặt xe này đã có biên bản ${dto.type === InspectionType.CHECK_OUT ? 'giao xe' : 'nhận lại xe'}`,
      );
    }

    if (dto.type === InspectionType.CHECK_IN) {
      const checkOut = booking.inspections.find(
        (i) => i.type === InspectionType.CHECK_OUT,
      );
      if (!checkOut) {
        throw new BadRequestException(
          'Cần phải lập biên bản bàn giao xe (Check-out) trước khi nhận lại xe (Check-in)',
        );
      }
      if (dto.odometer < checkOut.odometer) {
        throw new BadRequestException(
          'Số đồng hồ Odometer lúc nhận lại xe không thể nhỏ hơn lúc bàn giao xe',
        );
      }
    }

    const inspection = await this.prisma.vehicleInspection.create({
      data: {
        bookingId,
        type: dto.type,
        odometer: dto.odometer,
        fuelLevel: dto.fuelLevel,
        frontImageUrl: dto.frontImageUrl,
        backImageUrl: dto.backImageUrl,
        leftImageUrl: dto.leftImageUrl,
        rightImageUrl: dto.rightImageUrl,
        notes: dto.notes,
        inspectorId,
      },
    });

    // Tự động tính toán phụ phí trễ giờ & quá số km nếu là CHECK_IN
    let penaltyDetails = null;
    if (dto.type === InspectionType.CHECK_IN) {
      const checkOut = booking.inspections.find(
        (i) => i.type === InspectionType.CHECK_OUT,
      );
      const totalKmUsed = checkOut ? dto.odometer - checkOut.odometer : 0;
      const maxAllowedKm =
        (booking.vehicle.limitKmPerDay || 300) * booking.totalDays;
      const excessKm = Math.max(0, totalKmUsed - maxAllowedKm);
      const overLimitFee = excessKm * (booking.vehicle.overLimitFee || 3000);

      const now = new Date();
      const lateHours = Math.max(
        0,
        Math.ceil((now.getTime() - booking.endDate.getTime()) / (1000 * 3600)),
      );
      const overtimeFee = lateHours * (booking.vehicle.penaltyRate || 100000);

      const totalPenalty = overLimitFee + overtimeFee;

      penaltyDetails = {
        totalKmUsed,
        maxAllowedKm,
        excessKm,
        overLimitFee,
        lateHours,
        overtimeFee,
        totalPenalty,
      };
    }

    return {
      inspection,
      penaltyDetails,
    };
  }

  async getInspections(bookingId: string) {
    return await this.prisma.vehicleInspection.findMany({
      where: { bookingId },
      include: {
        inspector: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
