import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(): Promise<{
        vehicleStats: {
            total: number;
            available: number;
            rented: number;
            maintenance: number;
        };
        bookingsToday: number;
        revenueToday: number;
        revenueMonth: number;
        occupancyRate: number;
    }>;
    getFinancialReport(): Promise<{
        vehicleId: string;
        plateNumber: string;
        brand: string;
        model: string;
        revenue: number;
        maintenanceCost: number;
        otherExpense: number;
        totalCost: number;
        netProfit: number;
        occupancyRate: number;
    }[]>;
    getTopVehicles(): Promise<{
        topRevenue: {
            id: string;
            plateNumber: string;
            brand: string;
            model: string;
            revenue: number;
            frequency: number;
        }[];
        topFrequency: {
            id: string;
            plateNumber: string;
            brand: string;
            model: string;
            revenue: number;
            frequency: number;
        }[];
    }>;
}
