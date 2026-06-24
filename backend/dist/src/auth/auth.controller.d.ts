import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
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
    getMe(req: any): Promise<any>;
    googleLogin(body: {
        email: string;
        name: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    facebookLogin(body: {
        email: string;
        name: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    upgradeOwner(req: any, body: {
        phone: string;
        idCardNo: string;
        address: string;
    }): Promise<{
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
    verifyOwner(userId: string, body: {
        approve: boolean;
    }): Promise<{
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
    }>;
}
