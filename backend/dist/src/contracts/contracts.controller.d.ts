import { Role } from '@prisma/client';
import type { Request } from 'express';
import { ContractsService } from './contracts.service';
import { SignContractDto } from './dto/contract.dto';
type AuthenticatedRequest = Request & {
    user: {
        id: string;
        role: Role;
    };
};
export declare class ContractsController {
    private readonly contractsService;
    constructor(contractsService: ContractsService);
    getContract(req: AuthenticatedRequest, bookingId: string): Promise<{
        contract: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            terms: string;
            bookingId: string;
            renterSignature: string | null;
            ownerSignature: string | null;
            signedAt: Date | null;
            pdfUrl: string | null;
        };
        booking: {
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
            vehicle: {
                owner: {
                    id: string;
                    email: string;
                    phone: string | null;
                    idCardNo: string | null;
                    password: string;
                    name: string;
                    role: import("@prisma/client").$Enums.Role;
                    avatar: string | null;
                    address: string | null;
                    isVerifiedOwner: boolean;
                    ownerRequestAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
            } & {
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import("@prisma/client").$Enums.BookingStatus;
            pickupLocation: string;
            startDate: Date;
            endDate: Date;
            vehicleId: string;
            customerId: string;
            bookingNumber: string;
            dropoffLocation: string;
            totalDays: number;
            basePrice: number;
            discountAmount: number;
            totalPrice: number;
            couponCode: string | null;
            staffId: string | null;
            insuranceType: string;
            insuranceFee: number;
            depositPercent: number;
            depositAmount: number | null;
        };
    }>;
    signContract(bookingId: string, req: AuthenticatedRequest, dto: SignContractDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        terms: string;
        bookingId: string;
        renterSignature: string | null;
        ownerSignature: string | null;
        signedAt: Date | null;
        pdfUrl: string | null;
    }>;
}
export {};
