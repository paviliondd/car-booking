import { PrismaService } from '../prisma/prisma.service';
export declare class TicketsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, subject: string, message: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        userId: string;
        subject: string;
        message: string;
        reply: string | null;
        repliedAt: Date | null;
    }>;
    findAll(user: any): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        userId: string;
        subject: string;
        message: string;
        reply: string | null;
        repliedAt: Date | null;
    }[]>;
    reply(id: string, replyText: string, adminUser: any): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        userId: string;
        subject: string;
        message: string;
        reply: string | null;
        repliedAt: Date | null;
    }>;
}
