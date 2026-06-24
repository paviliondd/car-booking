import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(req: any, vehicleId: string, rating: number, comment: string): Promise<{
        customer: {
            id: string;
            phone: string;
            idCardNo: string;
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
            phone: string;
            idCardNo: string;
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
