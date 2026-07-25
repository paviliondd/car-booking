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
const notification_service_1 = require("../notification/notification.service");
const phone_1 = require("../common/phone");
const mail_templates_1 = require("../notification/mail-templates");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    notifications;
    redis;
    googleClient;
    constructor(prisma, jwtService, configService, notifications, redis) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notifications = notifications;
        this.redis = redis;
        this.googleClient = new google_auth_library_1.OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));
    }
    otpHash(phone, code, purpose) {
        const secret = this.configService.getOrThrow('JWT_SECRET');
        return (0, node_crypto_1.createHash)('sha256')
            .update(`${purpose}:${phone}:${code}:${secret}`)
            .digest('hex');
    }
    async sendOtp(rawPhone, purpose) {
        const phone = (0, phone_1.normalizeVietnamesePhone)(rawPhone);
        const ttl = Number(this.configService.get('OTP_TTL_SECONDS') || 300);
        const resendSeconds = Number(this.configService.get('OTP_RESEND_SECONDS') || 60);
        const maxSends = Number(this.configService.get('OTP_MAX_SENDS_PER_HOUR') || 5);
        const rateKey = `otp-hour:${purpose}:${phone}`;
        const sends = await this.redis.increment(rateKey, 3600);
        if (sends === null) {
            throw new common_1.ServiceUnavailableException('Dịch vụ xác minh đang tạm thời không khả dụng.');
        }
        if (sends > maxSends) {
            throw new common_1.BadRequestException('Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau.');
        }
        const lockKey = `otp-send:${purpose}:${phone}`;
        if (!(await this.redis.acquireLock(lockKey, resendSeconds * 1000))) {
            throw new common_1.BadRequestException(`Vui lòng chờ ${resendSeconds} giây trước khi yêu cầu mã mới.`);
        }
        const code = (0, node_crypto_1.randomInt)(0, 1_000_000).toString().padStart(6, '0');
        const otpKey = `otp:${purpose}:${phone}`;
        await this.redis.set(otpKey, JSON.stringify({
            hash: this.otpHash(phone, code, purpose),
            attempts: 0,
        }), ttl);
        if (!(await this.redis.get(otpKey))) {
            await this.redis.releaseLock(lockKey);
            throw new common_1.ServiceUnavailableException('Dịch vụ xác minh đang tạm thời không khả dụng.');
        }
        try {
            await this.notifications.sendSMS(phone, `datxe: Ma xac minh cua ban la ${code}. Ma co hieu luc ${Math.ceil(ttl / 60)} phut. Khong chia se ma nay.`, `otp-${purpose.split(':')[0]}`, undefined, undefined, true);
        }
        catch {
            await this.redis.del(otpKey);
            await this.redis.releaseLock(lockKey);
            throw new common_1.ServiceUnavailableException('Dịch vụ SMS tạm thời không khả dụng.');
        }
        return { sent: true, expiresIn: ttl };
    }
    async verifyOtp(rawPhone, code, purpose) {
        const phone = (0, phone_1.normalizeVietnamesePhone)(rawPhone);
        const key = `otp:${purpose}:${phone}`;
        const stored = await this.redis.get(key);
        if (!stored) {
            throw new common_1.UnauthorizedException('Mã xác minh không hợp lệ hoặc đã hết hạn');
        }
        let state;
        try {
            state = JSON.parse(stored);
        }
        catch {
            await this.redis.del(key);
            throw new common_1.UnauthorizedException('Mã xác minh không hợp lệ');
        }
        const maxAttempts = Number(this.configService.get('OTP_MAX_ATTEMPTS') || 5);
        if (state.attempts >= maxAttempts) {
            await this.redis.del(key);
            throw new common_1.UnauthorizedException('Bạn đã nhập sai quá số lần cho phép');
        }
        if (state.hash !== this.otpHash(phone, code, purpose)) {
            await this.redis.set(key, JSON.stringify({ ...state, attempts: state.attempts + 1 }), Number(this.configService.get('OTP_TTL_SECONDS') || 300));
            throw new common_1.UnauthorizedException('Mã xác minh không chính xác');
        }
        await this.redis.del(key);
        return phone;
    }
    async requestRegistrationCode(rawPhone) {
        const phone = (0, phone_1.normalizeVietnamesePhone)(rawPhone);
        if (await this.prisma.user.findUnique({ where: { phone } })) {
            throw new common_1.ConflictException('Số điện thoại đã được đăng ký');
        }
        return this.sendOtp(phone, 'register');
    }
    async register(dto) {
        const phone = await this.verifyOtp(dto.phone, dto.code, 'register');
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const name = dto.name.trim();
        try {
            const user = await this.prisma.user.create({
                data: {
                    phone,
                    phoneVerifiedAt: new Date(),
                    password: hashedPassword,
                    name,
                    role: client_1.Role.CUSTOMER,
                    customer: { create: { phone, fullName: name } },
                },
            });
            await this.notifications.sendSMS(phone, 'datxe: Chao mung ban den voi datxe. Tai khoan cua ban da duoc kich hoat.', 'welcome-customer', user.id, `welcome-customer:${user.id}`);
            return this.signUser(user);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Số điện thoại đã được đăng ký');
            }
            throw error;
        }
    }
    async login(dto) {
        const phone = (0, phone_1.normalizeVietnamesePhone)(dto.phone);
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user?.password ||
            !user.phoneVerifiedAt ||
            !(await bcrypt.compare(dto.password, user.password))) {
            throw new common_1.UnauthorizedException('Số điện thoại hoặc mật khẩu không chính xác');
        }
        return this.signUser(user);
    }
    async requestPasswordResetCode(rawPhone) {
        const phone = (0, phone_1.normalizeVietnamesePhone)(rawPhone);
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user?.password || !user.phoneVerifiedAt) {
            throw new common_1.BadRequestException('Tài khoản chưa thể đặt lại mật khẩu bằng số điện thoại');
        }
        return this.sendOtp(phone, 'password-reset');
    }
    async resetPassword(dto) {
        const phone = await this.verifyOtp(dto.phone, dto.code, 'password-reset');
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { password: await bcrypt.hash(dto.password, 12) },
            }),
            this.prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'RESET_PASSWORD',
                    targetTable: 'User',
                    targetId: user.id,
                },
            }),
        ]);
        return { reset: true };
    }
    async requestPhoneLinkCode(userId, rawPhone) {
        const phone = (0, phone_1.normalizeVietnamesePhone)(rawPhone);
        const existing = await this.prisma.user.findUnique({ where: { phone } });
        if (existing && existing.id !== userId) {
            throw new common_1.ConflictException('Số điện thoại đã thuộc tài khoản khác');
        }
        return this.sendOtp(phone, `phone-link:${userId}`);
    }
    async verifyPhoneLinkCode(userId, rawPhone, code) {
        const phone = await this.verifyOtp(rawPhone, code, `phone-link:${userId}`);
        try {
            const user = await this.prisma.$transaction(async (tx) => {
                const current = await tx.user.findUnique({ where: { id: userId } });
                if (!current)
                    throw new common_1.NotFoundException('Không tìm thấy tài khoản');
                const updated = await tx.user.update({
                    where: { id: userId },
                    data: { phone, phoneVerifiedAt: new Date() },
                });
                const existingCustomerWithPhone = await tx.customer.findUnique({
                    where: { phone },
                });
                if (existingCustomerWithPhone &&
                    existingCustomerWithPhone.userId &&
                    existingCustomerWithPhone.userId !== userId) {
                    throw new common_1.ConflictException('Số điện thoại đã thuộc tài khoản khác');
                }
                if (existingCustomerWithPhone && !existingCustomerWithPhone.userId) {
                    await tx.customer.update({
                        where: { id: existingCustomerWithPhone.id },
                        data: { userId, fullName: current.name },
                    });
                }
                else {
                    await tx.customer.upsert({
                        where: { userId },
                        create: { userId, phone, fullName: current.name },
                        update: { phone },
                    });
                }
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'VERIFY_PHONE',
                        targetTable: 'User',
                        targetId: userId,
                        oldValue: { phone: current.phone },
                        newValue: { phone },
                    },
                });
                return updated;
            });
            return this.publicUser(user);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Số điện thoại đã thuộc tài khoản khác');
            }
            throw error;
        }
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
            const name = payload.name?.trim() || email.split('@')[0];
            user = await this.prisma.user.create({
                data: {
                    email,
                    emailVerifiedAt: new Date(),
                    name,
                    avatar: payload.picture,
                    role: client_1.Role.CUSTOMER,
                    customer: { create: { fullName: name } },
                },
            });
        }
        else if (!user.emailVerifiedAt) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { emailVerifiedAt: new Date(), avatar: payload.picture },
            });
        }
        return this.signUser(user);
    }
    async facebookLogin(accessToken) {
        const appId = this.configService.get('FACEBOOK_APP_ID')?.trim();
        const appSecret = this.configService
            .get('FACEBOOK_APP_SECRET')
            ?.trim();
        if (!appId || !appSecret) {
            throw new common_1.ServiceUnavailableException('Đăng nhập Facebook chưa được cấu hình. Vui lòng thử lại sau.');
        }
        const debugUrl = new URL('https://graph.facebook.com/debug_token');
        debugUrl.searchParams.set('input_token', accessToken);
        debugUrl.searchParams.set('access_token', `${appId}|${appSecret}`);
        const debug = await this.fetchFacebookJson(debugUrl);
        if (!debug.data?.is_valid ||
            debug.data.app_id !== appId ||
            !debug.data.user_id) {
            throw new common_1.UnauthorizedException('Facebook access token không hợp lệ hoặc đã hết hạn');
        }
        const profileUrl = new URL('https://graph.facebook.com/me');
        profileUrl.searchParams.set('fields', 'id,name,picture.type(large)');
        profileUrl.searchParams.set('access_token', accessToken);
        const profile = await this.fetchFacebookJson(profileUrl);
        if (!profile.id || profile.id !== debug.data.user_id || !profile.name) {
            throw new common_1.UnauthorizedException('Không thể xác minh thông tin tài khoản Facebook');
        }
        const avatar = profile.picture?.data?.url;
        let user = await this.prisma.user.findUnique({
            where: { facebookId: profile.id },
        });
        if (!user) {
            try {
                user = await this.prisma.user.create({
                    data: {
                        facebookId: profile.id,
                        name: profile.name.trim(),
                        avatar,
                        role: client_1.Role.CUSTOMER,
                        customer: { create: { fullName: profile.name.trim() } },
                    },
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error.code === 'P2002') {
                    user = await this.prisma.user.findUnique({
                        where: { facebookId: profile.id },
                    });
                }
                else {
                    throw error;
                }
            }
        }
        else if (avatar && avatar !== user.avatar) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { avatar },
            });
        }
        if (!user) {
            throw new common_1.ServiceUnavailableException('Không thể hoàn tất đăng nhập Facebook. Vui lòng thử lại.');
        }
        return this.signUser(user);
    }
    async fetchFacebookJson(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new common_1.UnauthorizedException('Không thể xác minh phiên đăng nhập Facebook');
            }
            return (await response.json());
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            throw new common_1.ServiceUnavailableException('Không thể kết nối Facebook. Vui lòng thử lại.');
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async getMyOwnerApplication(userId) {
        return this.prisma.ownerLead.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createOwnerApplication(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        if (!user.phone || !user.phoneVerifiedAt) {
            throw new common_1.BadRequestException('Bạn cần xác minh số điện thoại trước khi đăng ký xe');
        }
        if (user.role === client_1.Role.OWNER && user.isVerifiedOwner) {
            throw new common_1.ConflictException('Tài khoản đã là chủ xe');
        }
        const duplicate = await this.prisma.ownerLead.findFirst({
            where: {
                userId,
                status: {
                    in: [
                        client_1.OwnerApplicationStatus.PENDING_REVIEW,
                        client_1.OwnerApplicationStatus.CONTACTING,
                        client_1.OwnerApplicationStatus.NEED_MORE_INFO,
                        client_1.OwnerApplicationStatus.APPROVED,
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (duplicate)
            return { ...duplicate, received: true };
        const applicationNumber = `OWN-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${(0, node_crypto_1.randomInt)(1000, 10000)}`;
        const lead = await this.prisma.$transaction(async (tx) => {
            const created = await tx.ownerLead.create({
                data: {
                    applicationNumber,
                    userId,
                    name: user.name,
                    phone: user.phone,
                    carName: dto.carName.trim(),
                    plateNumber: dto.plateNumber?.trim().toUpperCase() || undefined,
                    vehicleYear: dto.vehicleYear,
                    applicantNotes: dto.applicantNotes?.trim() || undefined,
                },
            });
            await tx.user.update({
                where: { id: userId },
                data: { ownerRequestAt: new Date(), isVerifiedOwner: false },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE_OWNER_APPLICATION',
                    targetTable: 'OwnerLead',
                    targetId: created.id,
                    newValue: {
                        applicationNumber,
                        carName: created.carName,
                        plateNumber: created.plateNumber,
                    },
                },
            });
            return created;
        });
        const base = this.configService.get('PUBLIC_APP_URL') ||
            'https://datxe.linuxunity.com';
        const admin = this.configService.get('ADMIN_NOTIFICATION_EMAIL');
        await Promise.all([
            this.notifications.sendSMS(lead.phone, `datxe: Da nhan ho so ${lead.applicationNumber}. Chung toi se lien he trong 1 ngay lam viec.`, 'owner-application-received', userId, `owner-received:${lead.id}`),
            admin
                ? this.notifications.sendEmail(admin, '[datxe] Hồ sơ chủ xe mới', (0, mail_templates_1.ownerAdminEmail)({
                    ...lead,
                    dashboardUrl: `${base}/dashboard/customers`,
                }), 'become-owner-admin')
                : Promise.resolve(),
        ]);
        return { ...lead, received: true };
    }
    async getOwnerRequests() {
        return this.prisma.ownerLead.findMany({
            where: {
                status: {
                    in: [
                        client_1.OwnerApplicationStatus.PENDING_REVIEW,
                        client_1.OwnerApplicationStatus.CONTACTING,
                        client_1.OwnerApplicationStatus.NEED_MORE_INFO,
                    ],
                },
            },
            include: {
                user: {
                    select: { id: true, email: true, phone: true, role: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async reviewOwnerApplication(applicationId, reviewerId, dto) {
        const application = await this.prisma.ownerLead.findUnique({
            where: { id: applicationId },
        });
        if (!application)
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ chủ xe');
        const reviewableStatuses = [
            client_1.OwnerApplicationStatus.CONTACTING,
            client_1.OwnerApplicationStatus.NEED_MORE_INFO,
            client_1.OwnerApplicationStatus.APPROVED,
            client_1.OwnerApplicationStatus.REJECTED,
        ];
        if (!reviewableStatuses.includes(dto.status)) {
            throw new common_1.BadRequestException('Trạng thái xử lý hồ sơ không hợp lệ');
        }
        if (application.status === client_1.OwnerApplicationStatus.APPROVED ||
            application.status === client_1.OwnerApplicationStatus.REJECTED) {
            throw new common_1.ConflictException('Hồ sơ này đã được xử lý');
        }
        if (dto.status === client_1.OwnerApplicationStatus.REJECTED &&
            !dto.rejectionReason?.trim()) {
            throw new common_1.BadRequestException('Cần nhập lý do từ chối');
        }
        let targetUserId = application.userId;
        if (!targetUserId && application.phone) {
            const normalized = (0, phone_1.normalizeVietnamesePhone)(application.phone);
            const matchedUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: application.phone },
                        ...(normalized ? [{ phone: normalized }] : []),
                    ],
                },
            });
            if (matchedUser) {
                targetUserId = matchedUser.id;
                await this.prisma.ownerLead.update({
                    where: { id: application.id },
                    data: { userId: targetUserId },
                });
            }
        }
        const result = await this.prisma.$transaction(async (tx) => {
            if (dto.status === client_1.OwnerApplicationStatus.APPROVED) {
                if (targetUserId) {
                    await tx.user.update({
                        where: { id: targetUserId },
                        data: {
                            role: client_1.Role.OWNER,
                            isVerifiedOwner: true,
                            phoneVerifiedAt: new Date(),
                        },
                    });
                    const plate = application.plateNumber?.trim().toUpperCase() ||
                        `DRAFT-${Date.now().toString().slice(-6)}`;
                    const existingVehicle = await tx.vehicle.findFirst({
                        where: {
                            OR: [{ plateNumber: plate }, { ownerId: targetUserId }],
                        },
                    });
                    if (!existingVehicle) {
                        const parts = application.carName.trim().split(' ');
                        const brand = parts[0] || 'Khác';
                        const model = parts.slice(1).join(' ') || application.carName.trim();
                        await tx.vehicle.create({
                            data: {
                                plateNumber: plate,
                                brand,
                                model,
                                year: application.vehicleYear || new Date().getFullYear(),
                                seats: 5,
                                transmission: 'AUTO',
                                fuel: 'GASOLINE',
                                color: 'Trắng',
                                dailyPrice: 800000,
                                weekendPrice: 1000000,
                                holidayPrice: 1200000,
                                penaltyRate: 100000,
                                status: client_1.VehicleStatus.LOCKED,
                                ownerId: targetUserId,
                                images: ['/images/placeholder-car.png'],
                            },
                        });
                    }
                }
            }
            const updated = await tx.ownerLead.update({
                where: { id: application.id },
                data: {
                    status: dto.status,
                    adminNotes: dto.adminNotes?.trim() || undefined,
                    rejectionReason: dto.rejectionReason?.trim() || undefined,
                    reviewedById: reviewerId,
                    reviewedAt: new Date(),
                    userId: targetUserId || undefined,
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: reviewerId,
                    action: `REVIEW_OWNER_APPLICATION_${dto.status}`,
                    targetTable: 'OwnerLead',
                    targetId: application.id,
                    oldValue: { status: application.status },
                    newValue: {
                        status: dto.status,
                        userId: targetUserId,
                        rejectionReason: dto.rejectionReason,
                    },
                },
            });
            return updated;
        });
        if (dto.status === client_1.OwnerApplicationStatus.APPROVED && application.phone) {
            await this.notifications.sendSMS(application.phone, `datxe: Ho so ${application.applicationNumber} da duoc duyet. Dang nhap tai https://datxe.linuxunity.com/auth de quan ly xe.`, 'owner-application-approved', targetUserId || undefined, `owner-approved:${application.id}`);
        }
        return result;
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
                phone: true,
                name: true,
                role: true,
                isVerifiedOwner: true,
                ownerRequestAt: true,
            },
        });
    }
    publicUser(user) {
        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            phoneVerifiedAt: user.phoneVerifiedAt,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            isVerifiedOwner: user.isVerifiedOwner,
            ownerRequestAt: user.ownerRequestAt,
        };
    }
    signUser(user) {
        const publicUser = this.publicUser(user);
        return {
            accessToken: this.jwtService.sign({
                email: user.email,
                sub: user.id,
                role: user.role,
                name: user.name,
            }),
            user: publicUser,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        notification_service_1.NotificationService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map