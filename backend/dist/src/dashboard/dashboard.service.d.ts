import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOverview(period: string): Promise<{
        totalContract: number;
        totalMoneyContract: number;
        totalMoneyForward: number;
        totalCollect: number;
        totalExpense: number;
    }>;
    getCarStatusSummary(): Promise<{
        waitConfirm: number;
        confirmed: number;
        received: number;
        returned: number;
        accident: number;
        pledged: number;
    }>;
    getRevenueChart(month: string): Promise<{
        date: string;
        revenue: number;
    }[]>;
    getTopServices(): Promise<{
        name: string;
        value: number;
    }[]>;
    getTopCars(limit: number): Promise<{
        maxRevenue: number;
        name: string;
        bookingsCount: number;
        revenue: number;
    }[]>;
    getNotifications(limit: number): Promise<{
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
    getCarViolateList(): Promise<{
        id: string;
        plateNumber: string;
        reason: string;
        fineAmount: number;
        violatedAt: string;
        status: string;
    }[]>;
}
