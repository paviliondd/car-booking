import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
type SocketIdentity = {
    id: string;
};
type ClientEvents = {
    sendMessage: (data: SendMessageDto) => void;
};
type ServerEvents = {
    messageReceived: (message: unknown) => void;
};
type SocketData = {
    identity?: SocketIdentity;
};
export declare class ChatGateway {
    private readonly chatService;
    private readonly jwtService;
    private readonly prisma;
    server: Server<ClientEvents, ServerEvents, Record<string, never>, SocketData>;
    constructor(chatService: ChatService, jwtService: JwtService, prisma: PrismaService);
    handleConnection(client: Socket<ClientEvents, ServerEvents, Record<string, never>, SocketData>): Promise<void>;
    handleMessage(client: Socket<ClientEvents, ServerEvents, Record<string, never>, SocketData>, data: SendMessageDto): Promise<({
        sender: {
            id: string;
            email: string;
            name: string;
        };
        receiver: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        message: string;
        senderId: string;
        receiverId: string;
    }) | undefined>;
}
export {};
