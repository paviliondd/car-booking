import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OwnerApplicationStatus, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { createHash, randomInt } from 'node:crypto';
import { NotificationService } from '../notification/notification.service';
import { ownerAdminEmail } from '../notification/mail-templates';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  LoginDto,
  OwnerApplicationDto,
  RegisterDto,
  ResetPasswordDto,
  ReviewOwnerApplicationDto,
} from './dto/auth.dto';

type OtpPurpose = 'register' | 'password-reset' | `phone-link:${string}`;

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notifications: NotificationService,
    private readonly redis: RedisService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  private normalizePhone(value: string) {
    const compact = value.replace(/[\s.-]/g, '');
    if (/^\+84\d{9}$/.test(compact)) return compact;
    if (/^84\d{9}$/.test(compact)) return `+${compact}`;
    if (/^0\d{9}$/.test(compact)) return `+84${compact.slice(1)}`;
    throw new BadRequestException('Số điện thoại không hợp lệ');
  }

  private otpHash(phone: string, code: string, purpose: OtpPurpose) {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return createHash('sha256')
      .update(`${purpose}:${phone}:${code}:${secret}`)
      .digest('hex');
  }

  private async sendOtp(rawPhone: string, purpose: OtpPurpose) {
    const phone = this.normalizePhone(rawPhone);
    const ttl = Number(
      this.configService.get<string>('OTP_TTL_SECONDS') || 300,
    );
    const resendSeconds = Number(
      this.configService.get<string>('OTP_RESEND_SECONDS') || 60,
    );
    const maxSends = Number(
      this.configService.get<string>('OTP_MAX_SENDS_PER_HOUR') || 5,
    );
    const rateKey = `otp-hour:${purpose}:${phone}`;
    const sends = await this.redis.increment(rateKey, 3600);
    if (sends === null) {
      throw new ServiceUnavailableException(
        'Dịch vụ xác minh đang tạm thời không khả dụng.',
      );
    }
    if (sends > maxSends) {
      throw new BadRequestException(
        'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau.',
      );
    }

    const lockKey = `otp-send:${purpose}:${phone}`;
    if (!(await this.redis.acquireLock(lockKey, resendSeconds * 1000))) {
      throw new BadRequestException(
        `Vui lòng chờ ${resendSeconds} giây trước khi yêu cầu mã mới.`,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const otpKey = `otp:${purpose}:${phone}`;
    await this.redis.set(
      otpKey,
      JSON.stringify({
        hash: this.otpHash(phone, code, purpose),
        attempts: 0,
      }),
      ttl,
    );
    if (!(await this.redis.get(otpKey))) {
      await this.redis.releaseLock(lockKey);
      throw new ServiceUnavailableException(
        'Dịch vụ xác minh đang tạm thời không khả dụng.',
      );
    }

    try {
      await this.notifications.sendSMS(
        phone,
        `datxe: Ma xac minh cua ban la ${code}. Ma co hieu luc ${Math.ceil(ttl / 60)} phut. Khong chia se ma nay.`,
        `otp-${purpose.split(':')[0]}`,
        undefined,
        undefined,
        true,
      );
    } catch {
      await this.redis.del(otpKey);
      await this.redis.releaseLock(lockKey);
      throw new ServiceUnavailableException(
        'Dịch vụ SMS tạm thời không khả dụng.',
      );
    }
    return { sent: true as const, expiresIn: ttl };
  }

  private async verifyOtp(rawPhone: string, code: string, purpose: OtpPurpose) {
    const phone = this.normalizePhone(rawPhone);
    const key = `otp:${purpose}:${phone}`;
    const stored = await this.redis.get(key);
    if (!stored) {
      throw new UnauthorizedException(
        'Mã xác minh không hợp lệ hoặc đã hết hạn',
      );
    }

    let state: { hash: string; attempts: number };
    try {
      state = JSON.parse(stored) as { hash: string; attempts: number };
    } catch {
      await this.redis.del(key);
      throw new UnauthorizedException('Mã xác minh không hợp lệ');
    }

    const maxAttempts = Number(
      this.configService.get<string>('OTP_MAX_ATTEMPTS') || 5,
    );
    if (state.attempts >= maxAttempts) {
      await this.redis.del(key);
      throw new UnauthorizedException('Bạn đã nhập sai quá số lần cho phép');
    }
    if (state.hash !== this.otpHash(phone, code, purpose)) {
      await this.redis.set(
        key,
        JSON.stringify({ ...state, attempts: state.attempts + 1 }),
        Number(this.configService.get<string>('OTP_TTL_SECONDS') || 300),
      );
      throw new UnauthorizedException('Mã xác minh không chính xác');
    }
    await this.redis.del(key);
    return phone;
  }

  async requestRegistrationCode(rawPhone: string) {
    const phone = this.normalizePhone(rawPhone);
    if (await this.prisma.user.findUnique({ where: { phone } })) {
      throw new ConflictException('Số điện thoại đã được đăng ký');
    }
    return this.sendOtp(phone, 'register');
  }

  async register(dto: RegisterDto) {
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
          role: Role.CUSTOMER,
          customer: { create: { phone, fullName: name } },
        },
      });
      await this.notifications.sendSMS(
        phone,
        'datxe: Chao mung ban den voi datxe. Tai khoan cua ban da duoc kich hoat.',
        'welcome-customer',
        user.id,
        `welcome-customer:${user.id}`,
      );
      return this.signUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Số điện thoại đã được đăng ký');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const phone = this.normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (
      !user?.password ||
      !user.phoneVerifiedAt ||
      !(await bcrypt.compare(dto.password, user.password))
    ) {
      throw new UnauthorizedException(
        'Số điện thoại hoặc mật khẩu không chính xác',
      );
    }
    return this.signUser(user);
  }

  async requestPasswordResetCode(rawPhone: string) {
    const phone = this.normalizePhone(rawPhone);
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user?.password || !user.phoneVerifiedAt) {
      throw new BadRequestException(
        'Tài khoản chưa thể đặt lại mật khẩu bằng số điện thoại',
      );
    }
    return this.sendOtp(phone, 'password-reset');
  }

  async resetPassword(dto: ResetPasswordDto) {
    const phone = await this.verifyOtp(dto.phone, dto.code, 'password-reset');
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
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

  async requestPhoneLinkCode(userId: string, rawPhone: string) {
    const phone = this.normalizePhone(rawPhone);
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Số điện thoại đã thuộc tài khoản khác');
    }
    return this.sendOtp(phone, `phone-link:${userId}`);
  }

  async verifyPhoneLinkCode(userId: string, rawPhone: string, code: string) {
    const phone = await this.verifyOtp(rawPhone, code, `phone-link:${userId}`);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const current = await tx.user.findUnique({ where: { id: userId } });
        if (!current) throw new NotFoundException('Không tìm thấy tài khoản');
        const updated = await tx.user.update({
          where: { id: userId },
          data: { phone, phoneVerifiedAt: new Date() },
        });
        await tx.customer.upsert({
          where: { userId },
          create: { userId, phone, fullName: current.name },
          update: { phone },
        });
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Số điện thoại đã thuộc tài khoản khác');
      }
      throw error;
    }
  }

  async googleLogin(credential: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new ServiceUnavailableException(
        'Đăng nhập Google chưa được cấu hình. Vui lòng thử lại sau.',
      );
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(
        'Google ID token không hợp lệ hoặc đã hết hạn',
      );
    }
    if (!payload?.email || !payload.email_verified || !payload.sub) {
      throw new UnauthorizedException('Tài khoản Google chưa xác minh email');
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
          role: Role.CUSTOMER,
          customer: { create: { fullName: name } },
        },
      });
    } else if (!user.emailVerifiedAt) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date(), avatar: payload.picture },
      });
    }
    return this.signUser(user);
  }

  async getMyOwnerApplication(userId: string) {
    return this.prisma.ownerLead.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOwnerApplication(userId: string, dto: OwnerApplicationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    if (!user.phone || !user.phoneVerifiedAt) {
      throw new BadRequestException(
        'Bạn cần xác minh số điện thoại trước khi đăng ký xe',
      );
    }
    if (user.role === Role.OWNER && user.isVerifiedOwner) {
      throw new ConflictException('Tài khoản đã là chủ xe');
    }
    const duplicate = await this.prisma.ownerLead.findFirst({
      where: {
        userId,
        status: {
          in: [
            OwnerApplicationStatus.PENDING_REVIEW,
            OwnerApplicationStatus.CONTACTING,
            OwnerApplicationStatus.NEED_MORE_INFO,
            OwnerApplicationStatus.APPROVED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (duplicate) return { ...duplicate, received: true as const };

    const applicationNumber = `OWN-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomInt(1000, 10000)}`;
    const lead = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ownerLead.create({
        data: {
          applicationNumber,
          userId,
          name: user.name,
          phone: user.phone!,
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

    const base =
      this.configService.get<string>('PUBLIC_APP_URL') ||
      'https://datxe.linuxunity.com';
    const admin = this.configService.get<string>('ADMIN_NOTIFICATION_EMAIL');
    await Promise.all([
      this.notifications.sendSMS(
        lead.phone,
        `datxe: Da nhan ho so ${lead.applicationNumber}. Chung toi se lien he trong 1 ngay lam viec.`,
        'owner-application-received',
        userId,
        `owner-received:${lead.id}`,
      ),
      admin
        ? this.notifications.sendEmail(
            admin,
            '[datxe] Hồ sơ chủ xe mới',
            ownerAdminEmail({
              ...lead,
              dashboardUrl: `${base}/dashboard/customers`,
            }),
            'become-owner-admin',
          )
        : Promise.resolve(),
    ]);
    return { ...lead, received: true as const };
  }

  async getOwnerRequests() {
    return this.prisma.ownerLead.findMany({
      where: {
        status: {
          in: [
            OwnerApplicationStatus.PENDING_REVIEW,
            OwnerApplicationStatus.CONTACTING,
            OwnerApplicationStatus.NEED_MORE_INFO,
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

  async reviewOwnerApplication(
    applicationId: string,
    reviewerId: string,
    dto: ReviewOwnerApplicationDto,
  ) {
    const application = await this.prisma.ownerLead.findUnique({
      where: { id: applicationId },
    });
    if (!application)
      throw new NotFoundException('Không tìm thấy hồ sơ chủ xe');
    const reviewableStatuses: OwnerApplicationStatus[] = [
      OwnerApplicationStatus.CONTACTING,
      OwnerApplicationStatus.NEED_MORE_INFO,
      OwnerApplicationStatus.APPROVED,
      OwnerApplicationStatus.REJECTED,
    ];
    if (!reviewableStatuses.includes(dto.status)) {
      throw new BadRequestException('Trạng thái xử lý hồ sơ không hợp lệ');
    }
    if (
      application.status === OwnerApplicationStatus.APPROVED ||
      application.status === OwnerApplicationStatus.REJECTED
    ) {
      throw new ConflictException('Hồ sơ này đã được xử lý');
    }
    if (
      dto.status === OwnerApplicationStatus.REJECTED &&
      !dto.rejectionReason?.trim()
    ) {
      throw new BadRequestException('Cần nhập lý do từ chối');
    }
    if (!application.userId) {
      throw new BadRequestException(
        'Hồ sơ cũ chưa liên kết tài khoản; cần xác minh người đăng ký trước',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.status === OwnerApplicationStatus.APPROVED) {
        const applicant = await tx.user.findUnique({
          where: { id: application.userId! },
        });
        if (!applicant?.phoneVerifiedAt) {
          throw new BadRequestException(
            'Tài khoản chưa xác minh số điện thoại',
          );
        }
        await tx.user.update({
          where: { id: application.userId! },
          data: { role: Role.OWNER, isVerifiedOwner: true },
        });
      }
      const updated = await tx.ownerLead.update({
        where: { id: application.id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes?.trim() || undefined,
          rejectionReason: dto.rejectionReason?.trim() || undefined,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: `REVIEW_OWNER_APPLICATION_${dto.status}`,
          targetTable: 'OwnerLead',
          targetId: application.id,
          oldValue: { status: application.status },
          newValue: { status: dto.status, userId: application.userId },
        },
      });
      return updated;
    });

    if (dto.status === OwnerApplicationStatus.APPROVED) {
      await this.notifications.sendSMS(
        application.phone,
        `datxe: Ho so ${application.applicationNumber} da duoc duyet. Dang nhap tai https://datxe.linuxunity.com/auth de quan ly xe.`,
        'owner-application-approved',
        application.userId,
        `owner-approved:${application.id}`,
      );
    }
    return result;
  }

  async verifyOwner(userId: string, approve: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: approve
        ? { isVerifiedOwner: true, role: Role.OWNER }
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

  private publicUser(user: {
    id: string;
    email: string | null;
    phone: string | null;
    phoneVerifiedAt: Date | null;
    name: string;
    avatar: string | null;
    role: Role;
    isVerifiedOwner: boolean;
    ownerRequestAt: Date | null;
  }) {
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

  private signUser(user: {
    id: string;
    email: string | null;
    phone: string | null;
    phoneVerifiedAt: Date | null;
    name: string;
    avatar: string | null;
    role: Role;
    isVerifiedOwner: boolean;
    ownerRequestAt: Date | null;
  }) {
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
}
