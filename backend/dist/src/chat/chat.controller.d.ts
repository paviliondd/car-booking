import type { Request } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
type AuthenticatedRequest = Request & {
    user: {
        id: string;
    };
};
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getPartners(req: AuthenticatedRequest): Promise<{
        id: string;
        name: string;
        email: string | null;
    }[]>;
    getHistory(req: AuthenticatedRequest, partnerId: string): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        senderId: string;
        receiverId: string;
    }[]>;
    sendMessage(req: AuthenticatedRequest, dto: SendMessageDto): Promise<{
        sender: {
            id: string;
            email: string | null;
            name: string;
        };
        receiver: {
            id: string;
            email: string | null;
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
export {};
