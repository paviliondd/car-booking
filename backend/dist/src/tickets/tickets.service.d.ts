import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
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
    findAll(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        userId: string;
        subject: string;
        message: string;
        reply: string | null;
        repliedAt: Date | null;
    }[]>;
    reply(id: string, replyText: string, adminUser: AuthenticatedUser): Promise<{
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
