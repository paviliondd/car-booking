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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_service_1 = require("./chat.service");
const chat_dto_1 = require("./dto/chat.dto");
let ChatGateway = class ChatGateway {
    chatService;
    jwtService;
    prisma;
    server;
    constructor(chatService, jwtService, prisma) {
        this.chatService = chatService;
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async handleConnection(client) {
        const token = typeof client.handshake.auth?.token === 'string'
            ? client.handshake.auth.token
            : undefined;
        if (!token) {
            client.disconnect(true);
            return;
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true },
            });
            if (!user)
                throw new Error('User not found');
            client.data.identity = user;
            await client.join(`user:${user.id}`);
        }
        catch {
            client.disconnect(true);
        }
    }
    async handleMessage(client, data) {
        const identity = client.data.identity;
        if (!identity) {
            client.disconnect(true);
            return;
        }
        const saved = await this.chatService.saveMessage(identity.id, data.receiverId, data.message);
        this.server
            .to([`user:${identity.id}`, `user:${data.receiverId}`])
            .emit('messageReceived', saved);
        return saved;
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        chat_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (process.env.CORS_ORIGINS ||
                'http://localhost:3000,https://datxe.linuxunity.com')
                .split(',')
                .map((origin) => origin.trim()),
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map