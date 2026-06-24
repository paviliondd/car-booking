import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(senderId: string, receiverId: string, message: string) {
    return await this.prisma.chatMessage.create({
      data: {
        senderId,
        receiverId,
        message,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getChatHistory(userA: string, userB: string) {
    return await this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getRecentChatPartners(userId: string) {
    // Tìm những người dùng mà user hiện tại đã từng nhắn tin qua lại
    const sent = await this.prisma.chatMessage.findMany({
      where: { senderId: userId },
      select: { receiver: { select: { id: true, name: true, email: true } } },
    });

    const received = await this.prisma.chatMessage.findMany({
      where: { receiverId: userId },
      select: { sender: { select: { id: true, name: true, email: true } } },
    });

    const partnersMap = new Map<string, any>();
    sent.forEach((m) => partnersMap.set(m.receiver.id, m.receiver));
    received.forEach((m) => partnersMap.set(m.sender.id, m.sender));

    return Array.from(partnersMap.values());
  }
}
