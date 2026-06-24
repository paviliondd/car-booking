import { PaymentMethod } from '@prisma/client';
export declare class CreateBookingDto {
    vehicleId: string;
    startDate: string;
    endDate: string;
    fullName: string;
    phone: string;
    idCardNo: string;
    email: string;
    pickupLocation: string;
    dropoffLocation: string;
    notes?: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    affiliateCode?: string;
}
export declare class TrackBookingDto {
    phone: string;
}
