import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, subject: string, message: string) {
    return await this.prisma.supportTicket.create({
      data: {
        userId,
        subject,
        message,
        status: 'OPEN',
      },
    });
  }

  async findAll(user: AuthenticatedUser) {
    if (user.role === Role.ADMIN || user.role === Role.STAFF) {
      return await this.prisma.supportTicket.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Khách hàng hoặc chủ xe chỉ xem được ticket của mình
    return await this.prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reply(id: string, replyText: string, adminUser: AuthenticatedUser) {
    if (adminUser.role !== Role.ADMIN && adminUser.role !== Role.STAFF) {
      throw new ForbiddenException(
        'Chỉ quản trị viên hoặc nhân viên mới có quyền phản hồi ticket.',
      );
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException(`Không tìm thấy ticket hỗ trợ với ID ${id}`);
    }

    return await this.prisma.supportTicket.update({
      where: { id },
      data: {
        reply: replyText,
        repliedAt: new Date(),
        status: 'RESOLVED',
      },
    });
  }
}
