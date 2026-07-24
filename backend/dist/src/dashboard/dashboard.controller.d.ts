import { DashboardService } from './dashboard.service';
import { Role } from '@prisma/client';
import type { Request } from 'express';
type DashboardRequest = Request & {
    user: {
        id: string;
        role: Role;
    };
};
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(req: DashboardRequest, period: string): Promise<{
        totalContract: number;
        totalMoneyContract: number;
        totalMoneyForward: number;
        totalCollect: number;
        totalExpense: number;
    }>;
    getCarStatusSummary(req: DashboardRequest): Promise<{
        waitConfirm: number;
        confirmed: number;
        received: number;
        returned: number;
        accident: number;
        pledged: number;
    }>;
    getRevenueChart(req: DashboardRequest, month: string): Promise<{
        date: string;
        revenue: number;
    }[]>;
    getTopServices(req: DashboardRequest): Promise<{
        name: string;
        value: number;
    }[]>;
    getTopCars(req: DashboardRequest, limit: string): Promise<{
        maxRevenue: number;
        name: string;
        bookingsCount: number;
        revenue: number;
    }[]>;
}
export declare class NotificationsController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getNotifications(req: DashboardRequest, limit: string): Promise<{
        id: string;
        title: string;
        desc: string;
        date: string;
    }[]>;
}
export {};
