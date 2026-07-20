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
    getNotifications(limit: string): {
        id: string;
        title: string;
        desc: string;
        date: string;
    }[];
}
export declare class CarsController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getNotifyList(): Promise<{
        id: string;
        plateNumber: string;
        brand: string;
        model: string;
        type: string;
        dueDate: string;
    }[]>;
    getViolateList(): {
        id: string;
        plateNumber: string;
        reason: string;
        fineAmount: number;
        violatedAt: string;
        status: string;
    }[];
    getAvailable(location: string, startDate: string, months: string): {
        id: string;
        brand: string;
        model: string;
        plateNumber: string;
        dailyPrice: number;
        monthlyPrice: number;
        images: string[];
        location: string;
    }[];
}
export declare class FeedbackController {
    createFeedback(body: {
        category: string;
        message: string;
    }): {
        success: boolean;
        message: string;
        data: {
            category: string;
            message: string;
        };
    };
}
export declare class RatingController {
    createRating(body: {
        stars: number;
        comment: string;
    }): {
        success: boolean;
        message: string;
        data: {
            stars: number;
            comment: string;
        };
    };
}
export declare class DashboardBookingController {
    createLongTermBooking(body: Record<string, unknown>): {
        success: boolean;
        message: string;
        bookingNumber: string;
        data: Record<string, unknown>;
    };
}
export declare class DashboardAuthController {
    logout(): {
        success: boolean;
        message: string;
    };
    forgotPassword(phone: string): {
        success: boolean;
        message: string;
    };
}
export {};
