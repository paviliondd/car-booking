"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = class ChatService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveMessage(senderId, receiverId, message) {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || senderId === receiverId) {
            throw new common_1.BadRequestException('Tin nhắn hoặc người nhận không hợp lệ');
        }
        const receiver = await this.prisma.user.findUnique({
            where: { id: receiverId },
            select: { id: true },
        });
        if (!receiver) {
            throw new common_1.BadRequestException('Không tìm thấy người nhận');
        }
        return await this.prisma.chatMessage.create({
            data: {
                senderId,
                receiverId,
                message: trimmedMessage,
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
    async getChatHistory(userA, userB) {
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
    async getRecentChatPartners(userId) {
        const sent = await this.prisma.chatMessage.findMany({
            where: { senderId: userId },
            select: { receiver: { select: { id: true, name: true, email: true } } },
        });
        const received = await this.prisma.chatMessage.findMany({
            where: { receiverId: userId },
            select: { sender: { select: { id: true, name: true, email: true } } },
        });
        const partnersMap = new Map();
        sent.forEach((m) => partnersMap.set(m.receiver.id, m.receiver));
        received.forEach((m) => partnersMap.set(m.sender.id, m.sender));
        return Array.from(partnersMap.values());
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map