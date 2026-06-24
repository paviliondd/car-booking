import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private signUser;
    private fallbackRegister;
    private fallbackLogin;
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
    oauthLogin(email: string, name: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    upgradeOwner(userId: string, dto: {
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
    } | {
        ownerRequestAt: Date;
        isVerifiedOwner: boolean;
        phone: string;
        idCardNo: string;
        address: string;
        id: string;
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
    verifyOwner(userId: string, approve: boolean): Promise<{
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
