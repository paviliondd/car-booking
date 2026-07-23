import {
  ConflictException,
  BadRequestException,
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
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  OwnerLeadDto,
  RegisterDto,
  ReviewOwnerApplicationDto,
  UpgradeOwnerDto,
} from './dto/auth.dto';
import { NotificationService } from '../notification/notification.service';
import { ownerAdminEmail } from '../notification/mail-templates';
import { RedisService } from '../redis/redis.service';

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

  async createOwnerLead(dto: OwnerLeadDto) {
    const phone = this.normalizePhone(dto.phone);
    const duplicate = await this.prisma.ownerLead.findFirst({
      where: {
        phone,
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
    if (duplicate) {
      return {
        id: duplicate.id,
        applicationNumber: duplicate.applicationNumber,
        received: true,
        status: duplicate.status,
      };
    }
    const applicationNumber = `OWN-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomInt(1000, 10000)}`;
    const lead = await this.prisma.ownerLead.create({
      data: {
        applicationNumber,
        name: dto.name.trim(),
        phone,
        carName: dto.carName.trim(),
        plateNumber: dto.plateNumber?.trim().toUpperCase() || undefined,
        vehicleYear: dto.vehicleYear,
        applicantNotes: dto.applicantNotes?.trim() || undefined,
      },
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
        undefined,
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
    return {
      id: lead.id,
      applicationNumber: lead.applicationNumber,
      received: true,
      status: lead.status,
    };
  }

  private normalizePhone(value: string) {
    const compact = value.replace(/[\s.-]/g, '');
    if (compact.startsWith('+84')) return compact;
    if (compact.startsWith('84')) return `+${compact}`;
    if (compact.startsWith('0')) return `+84${compact.slice(1)}`;
    throw new BadRequestException('Số điện thoại không hợp lệ');
  }

  private otpHash(phone: string, code: string) {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return createHash('sha256')
      .update(`${phone}:${code}:${secret}`)
      .digest('hex');
  }

  async requestPhoneCode(rawPhone: string) {
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
    const sends = await this.redis.increment(`otp-hour:${phone}`, 3600);
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
    const lock = await this.redis.acquireLock(
      `otp-send:${phone}`,
      resendSeconds * 1000,
    );
    if (!lock) {
      throw new BadRequestException(
        'Vui lòng chờ 60 giây trước khi yêu cầu mã mới.',
      );
    }
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.redis.set(
      `otp:auth:${phone}`,
      JSON.stringify({ hash: this.otpHash(phone, code), attempts: 0 }),
      ttl,
    );
    if (!(await this.redis.get(`otp:auth:${phone}`))) {
      await this.redis.releaseLock(`otp-send:${phone}`);
      throw new ServiceUnavailableException(
        'Dịch vụ xác minh đang tạm thời không khả dụng.',
      );
    }
    try {
      await this.notifications.sendSMS(
        phone,
        `datxe: Ma xac minh cua ban la ${code}. Ma co hieu luc ${Math.ceil(ttl / 60)} phut. Khong chia se ma nay.`,
        'auth-otp',
        undefined,
        undefined,
        true,
      );
    } catch {
      await this.redis.del(`otp:auth:${phone}`);
      await this.redis.releaseLock(`otp-send:${phone}`);
      throw new ServiceUnavailableException(
        'Dịch vụ SMS tạm thời không khả dụng.',
      );
    }
    return { sent: true, expiresIn: ttl };
  }

  async verifyPhoneCode(rawPhone: string, code: string, name: string) {
    const phone = this.normalizePhone(rawPhone);
    const key = `otp:auth:${phone}`;
    const stored = await this.redis.get(key);
    if (!stored) {
      throw new UnauthorizedException(
        'Mã xác minh không hợp lệ hoặc đã hết hạn',
      );
    }
    const state = JSON.parse(stored) as { hash: string; attempts: number };
    const maxAttempts = Number(
      this.configService.get<string>('OTP_MAX_ATTEMPTS') || 5,
    );
    if (state.attempts >= maxAttempts) {
      await this.redis.del(key);
      throw new UnauthorizedException('Bạn đã nhập sai quá số lần cho phép');
    }
    if (state.hash !== this.otpHash(phone, code)) {
      await this.redis.set(
        key,
        JSON.stringify({ ...state, attempts: state.attempts + 1 }),
        300,
      );
      throw new UnauthorizedException('Mã xác minh không chính xác');
    }
    await this.redis.del(key);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    let created = false;
    if (!user) {
      const suffix = randomBytes(8).toString('hex');
      user = await this.prisma.user.create({
        data: {
          phone,
          phoneVerifiedAt: new Date(),
          name: name.trim(),
          role: Role.CUSTOMER,
          customer: {
            create: {
              phone,
              fullName: name.trim(),
              idCardNo: `PENDING-${suffix}`,
            },
          },
        },
      });
      created = true;
    } else if (!user.phoneVerifiedAt) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }
    if (created) {
      await this.notifications.sendSMS(
        phone,
        'datxe: Chao mung ban den voi datxe. Tai khoan cua ban da duoc kich hoat.',
        'welcome-customer',
        user.id,
        `welcome-customer:${user.id}`,
      );
    }
    return this.signUser(user);
  }

  private signUser(user: {
    id: string;
    email: string | null;
    name: string;
    role: Role;
  }) {
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

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được đăng ký');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const suffix = randomBytes(8).toString('hex');

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: dto.name.trim(),
          idCardNo: dto.idCardNo?.trim() || undefined,
          role: Role.CUSTOMER,
          customer: {
            create: {
              phone: `PENDING-${suffix}`,
              fullName: dto.name.trim(),
              idCardNo: dto.idCardNo?.trim() || `PENDING-${suffix}`,
            },
          },
        },
        select: { id: true, email: true, name: true, role: true },
      });

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (
      !user?.password ||
      !(await bcrypt.compare(dto.password, user.password))
    ) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    return this.signUser(user);
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
      const suffix = randomBytes(12).toString('hex');
      user = await this.prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
          name: payload.name?.trim() || email.split('@')[0],
          avatar: payload.picture,
          role: Role.CUSTOMER,
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

  async upgradeOwner(userId: string, dto: UpgradeOwnerDto) {
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
      include: { user: { select: { id: true, email: true, role: true } } },
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
    if (
      dto.status !== OwnerApplicationStatus.CONTACTING &&
      dto.status !== OwnerApplicationStatus.NEED_MORE_INFO &&
      dto.status !== OwnerApplicationStatus.APPROVED &&
      dto.status !== OwnerApplicationStatus.REJECTED
    ) {
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

    let userId = application.userId;
    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.status === OwnerApplicationStatus.APPROVED) {
        let user = await tx.user.findUnique({
          where: { phone: application.phone },
        });
        if (user) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { role: Role.OWNER, isVerifiedOwner: true },
          });
        } else {
          user = await tx.user.create({
            data: {
              phone: application.phone,
              name: application.name,
              role: Role.OWNER,
              isVerifiedOwner: true,
            },
          });
        }
        userId = user.id;
      }
      const updated = await tx.ownerLead.update({
        where: { id: application.id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes?.trim() || undefined,
          rejectionReason: dto.rejectionReason?.trim() || undefined,
          userId,
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
          newValue: { status: dto.status, userId },
        },
      });
      return updated;
    });
    if (dto.status === OwnerApplicationStatus.APPROVED) {
      await this.notifications.sendSMS(
        application.phone,
        `datxe: Ho so ${application.applicationNumber} da duoc duyet. Dang nhap bang so dien thoai tai https://datxe.linuxunity.com/auth de quan ly xe.`,
        'owner-application-approved',
        userId || undefined,
        `owner-approved:${application.id}`,
      );
    }
    return result;
  }

  async updateEmail(userId: string, emailValue: string) {
    const email = emailValue.toLowerCase().trim();
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { email, emailVerifiedAt: null },
        select: { id: true, email: true, phone: true, name: true, role: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email đã được tài khoản khác sử dụng');
      }
      throw error;
    }
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
        name: true,
        role: true,
        isVerifiedOwner: true,
        ownerRequestAt: true,
      },
    });
  }
}
