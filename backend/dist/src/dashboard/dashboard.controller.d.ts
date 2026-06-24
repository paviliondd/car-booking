import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
    getTopCars(limit: string): Promise<{
        maxRevenue: number;
        name: string;
        bookingsCount: number;
        revenue: number;
    }[]>;
}
export declare class NotificationsController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getNotifications(limit: string): Promise<{
        id: string;
        title: string;
        desc: string;
        date: string;
    }[]>;
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
    getViolateList(): Promise<{
        id: string;
        plateNumber: string;
        reason: string;
        fineAmount: number;
        violatedAt: string;
        status: string;
    }[]>;
    getAvailable(location: string, startDate: string, months: string): Promise<{
        id: string;
        brand: string;
        model: string;
        plateNumber: string;
        dailyPrice: number;
        monthlyPrice: number;
        images: string[];
        location: string;
    }[]>;
}
export declare class FeedbackController {
    createFeedback(body: {
        category: string;
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            category: string;
            message: string;
        };
    }>;
}
export declare class RatingController {
    createRating(body: {
        stars: number;
        comment: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            stars: number;
            comment: string;
        };
    }>;
}
export declare class DashboardBookingController {
    createLongTermBooking(body: any): Promise<{
        success: boolean;
        message: string;
        bookingNumber: string;
        data: any;
    }>;
}
export declare class DashboardAuthController {
    logout(): Promise<{
        success: boolean;
        message: string;
    }>;
    forgotPassword(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
