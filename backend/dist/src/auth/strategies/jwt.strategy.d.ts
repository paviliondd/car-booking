import { Role } from '@prisma/client';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: string;
        role: Role;
    }): Promise<{
        id: string;
        email: string | null;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        avatar: string | null;
        phone: string | null;
        phoneVerifiedAt: Date | null;
        emailVerifiedAt: Date | null;
        idCardNo: string | null;
        address: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        isVerifiedOwner: boolean;
        ownerRequestAt: Date | null;
    }>;
}
export {};
