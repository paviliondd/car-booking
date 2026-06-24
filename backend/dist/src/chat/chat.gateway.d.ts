import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway {
    private readonly chatService;
    server: Server;
    constructor(chatService: ChatService);
    handleMessage(client: Socket, data: {
        senderId: string;
        receiverId: string;
        message: string;
    }): Promise<{
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
    }>;
}
