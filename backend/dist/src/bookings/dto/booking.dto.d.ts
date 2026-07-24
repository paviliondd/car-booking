import { BookingStatus, PaymentMethod } from '@prisma/client';
export declare class CreateBookingDto {
    vehicleId: string;
    startDate: string;
    endDate: string;
    fullName: string;
    phone: string;
    idCardNo: string;
    email: string;
    notes?: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    affiliateCode?: string;
    insuranceType?: string;
    depositPercent?: number;
    idCardFront?: string;
    idCardBack?: string;
    driverLicense?: string;
}
export declare class BookingQuoteDto {
    vehicleId: string;
    startDate: string;
    endDate: string;
    insuranceType: string;
    depositPercent: number;
    couponCode?: string;
}
export declare class CreateAdminBookingDto {
    vehicleId: string;
    startDate: string;
    endDate: string;
    fullName: string;
    phone: string;
    paymentMethod: PaymentMethod;
    notes?: string;
    insuranceType: string;
    depositPercent: number;
    quickBookingRequestId?: string;
}
export declare class TrackBookingDto {
    phone: string;
}
export declare class UpdateBookingStatusDto {
    status: BookingStatus;
}
