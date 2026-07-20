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
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    googleClient;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.googleClient = new google_auth_library_1.OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));
    }
    signUser(user) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            name: user.name,
        };
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
    async register(dto) {
        const email = dto.email.toLowerCase().trim();
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email đã được đăng ký');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const suffix = (0, node_crypto_1.randomBytes)(8).toString('hex');
        try {
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: dto.name.trim(),
                    phone: dto.phone?.trim() || undefined,
                    idCardNo: dto.idCardNo?.trim() || undefined,
                    role: client_1.Role.CUSTOMER,
                    customer: {
                        create: {
                            phone: dto.phone?.trim() || `PENDING-${suffix}`,
                            fullName: dto.name.trim(),
                            idCardNo: dto.idCardNo?.trim() || `PENDING-${suffix}`,
                        },
                    },
                },
                select: { id: true, email: true, name: true, role: true },
            });
            return user;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Email hoặc số điện thoại đã được sử dụng');
            }
            throw error;
        }
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });
        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không chính xác');
        }
        return this.signUser(user);
    }
    async googleLogin(credential) {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        if (!clientId) {
            throw new common_1.ServiceUnavailableException('Đăng nhập Google chưa được cấu hình. Vui lòng thử lại sau.');
        }
        let payload;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: credential,
                audience: clientId,
            });
            payload = ticket.getPayload();
        }
        catch {
            throw new common_1.UnauthorizedException('Google ID token không hợp lệ hoặc đã hết hạn');
        }
        if (!payload?.email || !payload.email_verified || !payload.sub) {
            throw new common_1.UnauthorizedException('Tài khoản Google chưa xác minh email');
        }
        const email = payload.email.toLowerCase();
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const suffix = (0, node_crypto_1.randomBytes)(12).toString('hex');
            user = await this.prisma.user.create({
                data: {
                    email,
                    password: await bcrypt.hash((0, node_crypto_1.randomBytes)(32).toString('hex'), 12),
                    name: payload.name?.trim() || email.split('@')[0],
                    avatar: payload.picture,
                    role: client_1.Role.CUSTOMER,
                    customer: {
                        create: {
                            phone: `GOOGLE-${suffix}`,
                            fullName: payload.name?.trim() || email.split('@')[0],
                            idCardNo: `GOOGLE-${suffix}`,
                        },
                    },
                },
            });
        }
        return this.signUser(user);
    }
    async upgradeOwner(userId, dto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                phone: dto.phone.trim(),
                idCardNo: dto.idCardNo.trim(),
                address: dto.address.trim(),
                ownerRequestAt: new Date(),
                isVerifiedOwner: false,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                address: true,
                ownerRequestAt: true,
                isVerifiedOwner: true,
            },
        });
    }
    async getOwnerRequests() {
        return this.prisma.user.findMany({
            where: { ownerRequestAt: { not: null }, isVerifiedOwner: false },
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
        return this.prisma.user.update({
            where: { id: userId },
            data: approve
                ? { isVerifiedOwner: true, role: client_1.Role.OWNER }
                : { ownerRequestAt: null, isVerifiedOwner: false },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerifiedOwner: true,
                ownerRequestAt: true,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map