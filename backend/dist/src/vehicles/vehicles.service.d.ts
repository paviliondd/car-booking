import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { Vehicle, VehicleStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
export declare class VehiclesService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly VIETNAM_HOLIDAYS;
    isHoliday(date: Date): boolean;
    calculateTotalPrice(vehicle: Vehicle, start: Date, end: Date): {
        totalPrice: number;
        totalDays: number;
        details: any[];
    };
    create(dto: CreateVehicleDto, ownerId?: string): Promise<Vehicle>;
    findByOwner(ownerId: string): Promise<Vehicle[]>;
    findAll(filters: {
        brand?: string;
        seats?: number;
    }): Promise<Vehicle[]>;
    findAvailableNow(filters: {
        brand?: string;
        seats?: number;
    }): Promise<Vehicle[]>;
    findAvailable(startDateStr: string, endDateStr: string, filters: {
        brand?: string;
        seats?: number;
    }): Promise<Vehicle[]>;
    findOne(id: string): Promise<Vehicle>;
    getCalendar(id: string, fromValue?: string, toValue?: string): Promise<{
        vehicle: {
            id: string;
            brand: string;
            model: string;
            status: import("@prisma/client").$Enums.VehicleStatus;
        };
        range: {
            from: Date;
            to: Date;
        };
        busyPeriods: ({
            type: "BOOKING";
            label: string;
            startDate: Date;
            endDate: Date;
        } | {
            type: "MAINTENANCE";
            label: string;
            startDate: Date;
            endDate: Date;
        })[];
    }>;
    private assertCanManage;
    update(id: string, dto: UpdateVehicleDto, actor: AuthenticatedUser): Promise<Vehicle>;
    updateStatus(id: string, status: VehicleStatus, actor: AuthenticatedUser): Promise<Vehicle>;
    delete(id: string, actor: AuthenticatedUser): Promise<void>;
    findSuggestions(brand: string, seats: number, startDateStr: string, endDateStr: string): Promise<Vehicle[]>;
}
