import { MaintenanceService } from './maintenance.service';
export declare class MaintenanceController {
    private readonly maintenanceService;
    constructor(maintenanceService: MaintenanceService);
    create(body: {
        vehicleId: string;
        type: string;
        scheduledDate: string;
        description?: string;
        cost?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        scheduledDate: Date;
        completedDate: Date | null;
        cost: number;
        description: string | null;
        vehicleId: string;
    }>;
    complete(id: string, cost: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        scheduledDate: Date;
        completedDate: Date | null;
        cost: number;
        description: string | null;
        vehicleId: string;
    }>;
    getAlerts(): Promise<{
        id: string;
        vehicleId: string;
        plateNumber: string;
        brand: string;
        model: string;
        type: string;
        scheduledDate: Date;
        description: string | null;
        daysRemaining: number;
    }[]>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        scheduledDate: Date;
        completedDate: Date | null;
        cost: number;
        description: string | null;
        vehicleId: string;
    }[]>;
}
