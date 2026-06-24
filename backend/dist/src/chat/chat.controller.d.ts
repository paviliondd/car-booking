import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getPartners(req: any): Promise<any[]>;
    getHistory(req: any, partnerId: string): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        senderId: string;
        receiverId: string;
    }[]>;
}
