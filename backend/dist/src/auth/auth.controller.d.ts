import { Role } from '@prisma/client';
import type { Request } from 'express';
import { FacebookLoginDto, GoogleLoginDto, LoginDto, OwnerApplicationDto, RegisterDto, RequestPhoneCodeDto, ResetPasswordDto, ReviewOwnerApplicationDto, VerifyOwnerDto, VerifyPhoneCodeDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
type AuthenticatedRequest = Request & {
    user: {
        id: string;
        role: Role;
    };
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    requestRegistrationCode(dto: RequestPhoneCodeDto): Promise<{
        sent: true;
        expiresIn: number;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string | null;
            phone: string | null;
            phoneVerifiedAt: Date | null;
            name: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            isVerifiedOwner: boolean;
            ownerRequestAt: Date | null;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string | null;
            phone: string | null;
            phoneVerifiedAt: Date | null;
            name: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            isVerifiedOwner: boolean;
            ownerRequestAt: Date | null;
        };
    }>;
    requestPasswordResetCode(dto: RequestPhoneCodeDto): Promise<{
        sent: true;
        expiresIn: number;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        reset: boolean;
    }>;
    getMe(req: AuthenticatedRequest): Express.User & {
        id: string;
        role: Role;
    };
    googleLogin(dto: GoogleLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string | null;
            phone: string | null;
            phoneVerifiedAt: Date | null;
            name: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            isVerifiedOwner: boolean;
            ownerRequestAt: Date | null;
        };
    }>;
    facebookLogin(dto: FacebookLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string | null;
            phone: string | null;
            phoneVerifiedAt: Date | null;
            name: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            isVerifiedOwner: boolean;
            ownerRequestAt: Date | null;
        };
    }>;
    requestPhoneLinkCode(req: AuthenticatedRequest, dto: RequestPhoneCodeDto): Promise<{
        sent: true;
        expiresIn: number;
    }>;
    verifyPhoneLinkCode(req: AuthenticatedRequest, dto: VerifyPhoneCodeDto): Promise<{
        id: string;
        email: string | null;
        phone: string | null;
        phoneVerifiedAt: Date | null;
        name: string;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        isVerifiedOwner: boolean;
        ownerRequestAt: Date | null;
    }>;
    getMyOwnerApplication(req: AuthenticatedRequest): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        plateNumber: string | null;
        status: import("@prisma/client").$Enums.OwnerApplicationStatus;
        userId: string | null;
        carName: string;
        vehicleYear: number | null;
        applicantNotes: string | null;
        adminNotes: string | null;
        rejectionReason: string | null;
        applicationNumber: string;
        assignedStaffId: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
    } | null>;
    createOwnerApplication(req: AuthenticatedRequest, dto: OwnerApplicationDto): Promise<{
        received: true;
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        plateNumber: string | null;
        status: import("@prisma/client").$Enums.OwnerApplicationStatus;
        userId: string | null;
        carName: string;
        vehicleYear: number | null;
        applicantNotes: string | null;
        adminNotes: string | null;
        rejectionReason: string | null;
        applicationNumber: string;
        assignedStaffId: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
    }>;
    getOwnerRequests(): Promise<({
        user: {
            id: string;
            email: string | null;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
        } | null;
    } & {
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        plateNumber: string | null;
        status: import("@prisma/client").$Enums.OwnerApplicationStatus;
        userId: string | null;
        carName: string;
        vehicleYear: number | null;
        applicantNotes: string | null;
        adminNotes: string | null;
        rejectionReason: string | null;
        applicationNumber: string;
        assignedStaffId: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
    })[]>;
    reviewOwnerApplication(req: AuthenticatedRequest, applicationId: string, dto: ReviewOwnerApplicationDto): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        plateNumber: string | null;
        status: import("@prisma/client").$Enums.OwnerApplicationStatus;
        userId: string | null;
        carName: string;
        vehicleYear: number | null;
        applicantNotes: string | null;
        adminNotes: string | null;
        rejectionReason: string | null;
        applicationNumber: string;
        assignedStaffId: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
    }>;
    verifyOwner(userId: string, dto: VerifyOwnerDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        isVerifiedOwner: boolean;
        ownerRequestAt: Date | null;
    }>;
}
export {};
