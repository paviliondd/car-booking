import { OwnerApplicationStatus } from '@prisma/client';
export declare class RequestPhoneCodeDto {
    phone: string;
}
export declare class RegisterDto extends RequestPhoneCodeDto {
    code: string;
    name: string;
    password: string;
}
export declare class LoginDto extends RequestPhoneCodeDto {
    password: string;
}
export declare class ResetPasswordDto extends RequestPhoneCodeDto {
    code: string;
    password: string;
}
export declare class VerifyPhoneCodeDto extends RequestPhoneCodeDto {
    code: string;
}
export declare class GoogleLoginDto {
    credential: string;
}
export declare class FacebookLoginDto {
    accessToken: string;
}
export declare class OwnerApplicationDto {
    carName: string;
    plateNumber?: string;
    vehicleYear?: number;
    applicantNotes?: string;
}
export declare class VerifyOwnerDto {
    approve: boolean;
}
export declare class ReviewOwnerApplicationDto {
    status: OwnerApplicationStatus;
    adminNotes?: string;
    rejectionReason?: string;
}
