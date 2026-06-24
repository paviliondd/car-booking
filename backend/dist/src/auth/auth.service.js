"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                role: dto.role || client_1.Role.CUSTOMER,
                ...(dto.role === client_1.Role.CUSTOMER || !dto.role
                    ? {
                        customer: {
                            create: {
                                phone: dto.phone || '',
                                fullName: dto.name,
                                idCardNo: dto.idCardNo || `CCCD-${Date.now()}`,
                            },
                        },
                    }
                    : {}),
            },
            include: {
                customer: true,
            },
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }
    async oauthLogin(email, name) {
        let user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            const dummyPassword = await bcrypt.hash(`OAuth-${Math.random()}`, 10);
            user = await this.prisma.user.create({
                data: {
                    email,
                    password: dummyPassword,
                    name,
                    role: client_1.Role.CUSTOMER,
                    customer: {
                        create: {
                            phone: `0000-${Date.now()}`,
                            fullName: name,
                            idCardNo: `CCCD-${Date.now()}`,
                        },
                    },
                },
            });
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }
    async upgradeOwner(userId, dto) {
        return await this.prisma.user.update({
            where: { id: userId },
            data: {
                phone: dto.phone,
                idCardNo: dto.idCardNo,
                address: dto.address,
                ownerRequestAt: new Date(),
                isVerifiedOwner: false,
            },
        });
    }
    async getOwnerRequests() {
        return await this.prisma.user.findMany({
            where: {
                ownerRequestAt: { not: null },
                isVerifiedOwner: false,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                idCardNo: true,
                address: true,
                ownerRequestAt: true,
            },
        });
    }
    async verifyOwner(userId, approve) {
        if (approve) {
            return await this.prisma.user.update({
                where: { id: userId },
                data: {
                    isVerifiedOwner: true,
                    role: client_1.Role.OWNER,
                },
            });
        }
        else {
            return await this.prisma.user.update({
                where: { id: userId },
                data: {
                    ownerRequestAt: null,
                    isVerifiedOwner: false,
                },
            });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map