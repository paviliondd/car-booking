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
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TicketsService = class TicketsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, subject, message) {
        return await this.prisma.supportTicket.create({
            data: {
                userId,
                subject,
                message,
                status: 'OPEN',
            },
        });
    }
    async findAll(user) {
        if (user.role === client_1.Role.ADMIN || user.role === client_1.Role.STAFF) {
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
        return await this.prisma.supportTicket.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    async reply(id, replyText, adminUser) {
        if (adminUser.role !== client_1.Role.ADMIN && adminUser.role !== client_1.Role.STAFF) {
            throw new common_1.ForbiddenException('Chỉ quản trị viên hoặc nhân viên mới có quyền phản hồi ticket.');
        }
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
        });
        if (!ticket) {
            throw new common_1.NotFoundException(`Không tìm thấy ticket hỗ trợ với ID ${id}`);
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
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map