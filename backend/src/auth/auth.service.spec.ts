import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { NotificationService } from '../notification/notification.service';
import type { RedisService } from '../redis/redis.service';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';

describe('AuthService phone authentication', () => {
  const storedOtp = new Map<string, string>();
  const configValues = new Map<string, string>();
  let lastSms = '';
  const user = {
    id: 'user-1',
    email: null,
    phone: '+84901234567',
    phoneVerifiedAt: new Date(),
    emailVerifiedAt: null,
    password: '',
    name: 'Nguyễn Văn A',
    avatar: null,
    role: Role.CUSTOMER,
    isVerifiedOwner: false,
    ownerRequestAt: null,
  };
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const jwtMock = { sign: jest.fn(() => 'signed-token') };
  const configMock = {
    get: jest.fn((key: string) => {
      if (configValues.has(key)) return configValues.get(key);
      if (key === 'OTP_TTL_SECONDS') return '300';
      if (key === 'OTP_RESEND_SECONDS') return '60';
      if (key === 'OTP_MAX_ATTEMPTS') return '5';
      if (key === 'OTP_MAX_SENDS_PER_HOUR') return '5';
      return undefined;
    }),
    getOrThrow: jest.fn(() => 'test-jwt-secret'),
  };
  const notificationMock = {
    sendSMS: jest.fn((_phone: string, message: string) => {
      lastSms = message;
      return Promise.resolve(undefined);
    }),
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };
  const redisMock = {
    increment: jest.fn().mockResolvedValue(1),
    acquireLock: jest.fn().mockResolvedValue(true),
    releaseLock: jest.fn().mockResolvedValue(undefined),
    set: jest.fn((key: string, value: string) => {
      storedOtp.set(key, value);
      return Promise.resolve();
    }),
    get: jest.fn((key: string) => Promise.resolve(storedOtp.get(key) || null)),
    del: jest.fn((key: string) => {
      storedOtp.delete(key);
      return Promise.resolve();
    }),
  };

  const service = new AuthService(
    prismaMock as unknown as PrismaService,
    jwtMock as unknown as JwtService,
    configMock as unknown as ConfigService,
    notificationMock as unknown as NotificationService,
    redisMock as unknown as RedisService,
  );
  const fetchMock = jest.spyOn(global, 'fetch');

  beforeEach(() => {
    storedOtp.clear();
    configValues.clear();
    lastSms = '';
    jest.clearAllMocks();
    fetchMock.mockReset();
    jwtMock.sign.mockReturnValue('signed-token');
    redisMock.increment.mockResolvedValue(1);
    redisMock.acquireLock.mockResolvedValue(true);
  });

  afterAll(() => {
    fetchMock.mockRestore();
  });

  it('đăng nhập bằng số điện thoại đã chuẩn hóa và mật khẩu đúng', async () => {
    const password = 'Datxe1234';
    prismaMock.user.findUnique.mockResolvedValue({
      ...user,
      password: await bcrypt.hash(password, 12),
    });

    await expect(
      service.login({ phone: '0901234567', password }),
    ).resolves.toMatchObject({
      accessToken: 'signed-token',
      user: { id: user.id, phone: user.phone, role: Role.CUSTOMER },
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { phone: '+84901234567' },
    });
  });

  it('không tiết lộ tài khoản hay mật khẩu nào sai', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...user,
      password: await bcrypt.hash('Correct123', 12),
    });

    await expect(
      service.login({ phone: '0901234567', password: 'Wrong1234' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('không gửi OTP đăng ký cho số đã tồn tại', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    await expect(service.requestRegistrationCode('0901234567')).rejects.toThrow(
      ConflictException,
    );
    expect(notificationMock.sendSMS).not.toHaveBeenCalled();
  });

  it('chỉ tạo tài khoản sau khi OTP đăng ký hợp lệ', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      ...user,
      password: await bcrypt.hash('Datxe1234', 12),
    });

    await service.requestRegistrationCode('0901234567');
    const code = lastSms.match(/\b\d{6}\b/)?.[0];
    expect(code).toBeDefined();

    await expect(
      service.register({
        phone: '0901234567',
        code: code!,
        name: user.name,
        password: 'Datxe1234',
      }),
    ).resolves.toMatchObject({
      accessToken: 'signed-token',
      user: { phone: '+84901234567' },
    });
    const createCalls = prismaMock.user.create.mock.calls as unknown as Array<
      [
        {
          data: {
            phone: string;
            phoneVerifiedAt: unknown;
            role: Role;
          };
        },
      ]
    >;
    expect(createCalls[0]?.[0].data.phone).toBe('+84901234567');
    expect(createCalls[0]?.[0].data.phoneVerifiedAt).toBeInstanceOf(Date);
    expect(createCalls[0]?.[0].data.role).toBe(Role.CUSTOMER);
  });

  it('xác minh access token Facebook ở backend trước khi tạo tài khoản', async () => {
    configValues.set('FACEBOOK_APP_ID', 'facebook-app-id');
    configValues.set('FACEBOOK_APP_SECRET', 'facebook-app-secret');
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              app_id: 'facebook-app-id',
              is_valid: true,
              user_id: 'facebook-user-1',
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'facebook-user-1',
            name: 'Khách Facebook',
            picture: { data: { url: 'https://example.com/avatar.jpg' } },
          }),
          { status: 200 },
        ),
      );
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      ...user,
      facebookId: 'facebook-user-1',
      name: 'Khách Facebook',
      avatar: 'https://example.com/avatar.jpg',
    });

    await expect(
      service.facebookLogin('facebook-access-token-value'),
    ).resolves.toMatchObject({
      accessToken: 'signed-token',
      user: { name: 'Khách Facebook', role: Role.CUSTOMER },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        facebookId: 'facebook-user-1',
        name: 'Khách Facebook',
        avatar: 'https://example.com/avatar.jpg',
        role: Role.CUSTOMER,
        customer: { create: { fullName: 'Khách Facebook' } },
      },
    });
  });

  it('từ chối token Facebook được cấp cho ứng dụng khác', async () => {
    configValues.set('FACEBOOK_APP_ID', 'facebook-app-id');
    configValues.set('FACEBOOK_APP_SECRET', 'facebook-app-secret');
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            app_id: 'another-app-id',
            is_valid: true,
            user_id: 'facebook-user-1',
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      service.facebookLogin('facebook-access-token-value'),
    ).rejects.toThrow(UnauthorizedException);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});
