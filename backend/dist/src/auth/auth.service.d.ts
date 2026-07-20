import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpgradeOwnerDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly googleClient;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    private signUser;
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
    googleLogin(credential: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    upgradeOwner(userId: string, dto: UpgradeOwnerDto): Promise<{
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
    verifyOwner(userId: string, approve: boolean): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        isVerifiedOwner: boolean;
        ownerRequestAt: Date | null;
    }>;
}
