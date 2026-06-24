import { PrismaService } from '../prisma/prisma.service';
import { Maintenance } from '@prisma/client';
export declare class MaintenanceService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        vehicleId: string;
        type: string;
        scheduledDate: string;
        description?: string;
        cost?: number;
    }): Promise<Maintenance>;
    complete(id: string, cost: number): Promise<Maintenance>;
    findAll(): Promise<Maintenance[]>;
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
}
