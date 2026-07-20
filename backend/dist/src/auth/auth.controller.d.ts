import { Role } from '@prisma/client';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleLoginDto, LoginDto, RegisterDto, UpgradeOwnerDto, VerifyOwnerDto } from './dto/auth.dto';
type AuthenticatedRequest = Request & {
    user: {
        id: string;
        role: Role;
    };
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    getMe(req: AuthenticatedRequest): Express.User & {
        id: string;
        role: Role;
    };
    googleLogin(dto: GoogleLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    upgradeOwner(req: AuthenticatedRequest, dto: UpgradeOwnerDto): Promise<{
        id: string;
        email: string;
        phone: string | null;
        name: string;
        address: string | null;
        isVerifiedOwner: boolean;
        ownerRequestAt: Date | null;
    }>;
    getOwnerRequests(): Promise<{
        id: string;
        email: string;
        phone: string | null;
        idCardNo: string | null;
        name: string;
        address: string | null;
        ownerRequestAt: Date | null;
    }[]>;
    verifyOwner(userId: string, dto: VerifyOwnerDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        isVerifiedOwner: boolean;
        ownerRequestAt: Date | null;
    }>;
}
export {};
