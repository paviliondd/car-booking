import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/vehicle.dto';
import { Vehicle, VehicleStatus } from '@prisma/client';
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
    findAvailable(startDateStr: string, endDateStr: string, filters: {
        brand?: string;
        seats?: number;
    }): Promise<Vehicle[]>;
    findOne(id: string): Promise<Vehicle>;
    getCalendar(id: string): Promise<{
        vehicle: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            limitKmPerDay: number | null;
            plateNumber: string;
            brand: string;
            model: string;
            year: number;
            seats: number;
            transmission: string;
            fuel: string;
            color: string;
            dailyPrice: number;
            weekendPrice: number;
            holidayPrice: number;
            penaltyRate: number;
            images: string[];
            videoUrl: string | null;
            status: import("@prisma/client").$Enums.VehicleStatus;
            overLimitFee: number | null;
            pickupLocation: string;
            latitude: number | null;
            longitude: number | null;
            terms: string | null;
            ownerId: string | null;
        };
        bookings: {
            id: string;
            status: import("@prisma/client").$Enums.BookingStatus;
            startDate: Date;
            endDate: Date;
        }[];
        maintenances: {
            id: string;
            type: string;
            scheduledDate: Date;
        }[];
    }>;
    update(id: string, dto: Partial<CreateVehicleDto>): Promise<Vehicle>;
    updateStatus(id: string, status: VehicleStatus): Promise<Vehicle>;
    delete(id: string): Promise<void>;
    findSuggestions(brand: string, seats: number, startDateStr: string, endDateStr: string): Promise<Vehicle[]>;
}
