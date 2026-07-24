import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, vehicleId: string, rating: number, comment: string): Promise<{
        customer: {
            id: string;
            phone: string | null;
            idCardNo: string | null;
            createdAt: Date;
            updatedAt: Date;
            fullName: string;
            idCardFront: string | null;
            idCardBack: string | null;
            driverLicense: string | null;
            segment: import("@prisma/client").$Enums.CustomerSegment;
            notes: string | null;
            affiliateId: string | null;
            userId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        vehicleId: string;
        rating: number;
        comment: string | null;
        customerId: string;
    }>;
    findByVehicle(vehicleId: string): Promise<({
        customer: {
            id: string;
            phone: string | null;
            idCardNo: string | null;
            createdAt: Date;
            updatedAt: Date;
            fullName: string;
            idCardFront: string | null;
            idCardBack: string | null;
            driverLicense: string | null;
            segment: import("@prisma/client").$Enums.CustomerSegment;
            notes: string | null;
            affiliateId: string | null;
            userId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        vehicleId: string;
        rating: number;
        comment: string | null;
        customerId: string;
    })[]>;
}
