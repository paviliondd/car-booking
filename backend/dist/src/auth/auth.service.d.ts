import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto, OwnerApplicationDto, RegisterDto, ResetPasswordDto, ReviewOwnerApplicationDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly notifications;
    private readonly redis;
    private readonly googleClient;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, notifications: NotificationService, redis: RedisService);
    private otpHash;
    private sendOtp;
    private verifyOtp;
    requestRegistrationCode(rawPhone: string): Promise<{
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
    requestPasswordResetCode(rawPhone: string): Promise<{
        sent: true;
        expiresIn: number;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        reset: boolean;
    }>;
    requestPhoneLinkCode(userId: string, rawPhone: string): Promise<{
        sent: true;
        expiresIn: number;
    }>;
    verifyPhoneLinkCode(userId: string, rawPhone: string, code: string): Promise<{
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
    googleLogin(credential: string): Promise<{
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
    facebookLogin(accessToken: string): Promise<{
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
    private fetchFacebookJson;
    getMyOwnerApplication(userId: string): Promise<{
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
    createOwnerApplication(userId: string, dto: OwnerApplicationDto): Promise<{
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
    reviewOwnerApplication(applicationId: string, reviewerId: string, dto: ReviewOwnerApplicationDto): Promise<{
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
    verifyOwner(userId: string, approve: boolean): Promise<{
        id: string;
        email: string | null;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        isVerifiedOwner: boolean;
        ownerRequestAt: Date | null;
    }>;
    private publicUser;
    private signUser;
}
