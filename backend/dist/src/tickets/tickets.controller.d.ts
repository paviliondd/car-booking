import { TicketsService } from './tickets.service';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    create(req: any, subject: string, message: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        userId: string;
        subject: string;
        message: string;
        reply: string | null;
        repliedAt: Date | null;
    }>;
    findAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        userId: string;
        subject: string;
        message: string;
        reply: string | null;
        repliedAt: Date | null;
    }[]>;
    reply(id: string, reply: string, req: any): Promise<{
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
