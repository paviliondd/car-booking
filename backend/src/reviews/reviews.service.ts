import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    vehicleId: string,
    rating: number,
    comment: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user || !user.customer) {
      throw new BadRequestException(
        'Chỉ khách hàng đã đăng ký hồ sơ đầy đủ mới có quyền đánh giá xe.',
      );
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5 sao.');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Không tìm thấy xe với ID ${vehicleId}`);
    }

    return await this.prisma.review.create({
      data: {
        vehicleId,
        customerId: user.customer.id,
        rating,
        comment,
      },
      include: {
        customer: true,
      },
    });
  }

  async findByVehicle(vehicleId: string) {
    return await this.prisma.review.findMany({
      where: { vehicleId },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
