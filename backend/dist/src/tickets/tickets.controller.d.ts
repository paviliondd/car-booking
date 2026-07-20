import { TicketsService } from './tickets.service';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';
import { CreateTicketDto, ReplyTicketDto } from './dto/ticket.dto';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    create(req: AuthenticatedRequest, dto: CreateTicketDto): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        userId: string;
        subject: string;
        message: string;
        reply: string | null;
        repliedAt: Date | null;
    }>;
    findAll(req: AuthenticatedRequest): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        userId: string;
        subject: string;
        message: string;
        reply: string | null;
        repliedAt: Date | null;
    }[]>;
    reply(id: string, dto: ReplyTicketDto, req: AuthenticatedRequest): Promise<{
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
