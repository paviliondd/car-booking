import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    saveMessage(senderId: string, receiverId: string, message: string): Promise<{
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
    getChatHistory(userA: string, userB: string): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        senderId: string;
        receiverId: string;
    }[]>;
    getRecentChatPartners(userId: string): Promise<any[]>;
}
