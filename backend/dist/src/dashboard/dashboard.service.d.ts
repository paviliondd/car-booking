import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    private isDemoEnabled;
    private useDemoOrThrow;
    private ownerId;
    private demoOverview;
    private demoRevenueChart;
    getOverview(period: string, actor: {
        id: string;
        role: Role;
    }): Promise<{
        totalContract: number;
        totalMoneyContract: number;
        totalMoneyForward: number;
        totalCollect: number;
        totalExpense: number;
    }>;
    getCarStatusSummary(actor: {
        id: string;
        role: Role;
    }): Promise<{
        waitConfirm: number;
        confirmed: number;
        received: number;
        returned: number;
        accident: number;
        pledged: number;
    }>;
    getRevenueChart(month: string, actor: {
        id: string;
        role: Role;
    }): Promise<{
        date: string;
        revenue: number;
    }[]>;
    getTopServices(actor: {
        id: string;
        role: Role;
    }): Promise<{
        name: string;
        value: number;
    }[]>;
    getTopCars(limit: number, actor: {
        id: string;
        role: Role;
    }): Promise<{
        maxRevenue: number;
        name: string;
        bookingsCount: number;
        revenue: number;
    }[]>;
    getNotifications(limit: number, actor: {
        id: string;
        role: Role;
    }): Promise<{
        id: string;
        title: string;
        desc: string;
        date: string;
    }[]>;
    getCarNotifyList(): Promise<{
        id: string;
        plateNumber: string;
        brand: string;
        model: string;
        type: string;
        dueDate: string;
    }[]>;
    getCarViolateList(): {
        id: string;
        plateNumber: string;
        reason: string;
        fineAmount: number;
        violatedAt: string;
        status: string;
    }[];
}
