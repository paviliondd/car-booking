import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  QuickBookingSmsStatus,
  QuickBookingStatus,
  VehicleStatus,
} from '@prisma/client';
import type { NotificationService } from '../notification/notification.service';
import type { PrismaService } from '../prisma/prisma.service';
import { QuickBookingsService } from './quick-bookings.service';

describe('QuickBookingsService', () => {
  const startDate = new Date(Date.now() + 2 * 86_400_000);
  const endDate = new Date(Date.now() + 3 * 86_400_000);
  const vehicle = {
    id: '5d0e689e-dd1c-495c-a59f-606ed75b2504',
    brand: 'Toyota',
    model: 'Vios',
    plateNumber: '86A-12345',
    status: VehicleStatus.AVAILABLE,
  };
  const quickRequest = {
    id: 'f5eb56cf-24b1-4682-b4ef-d13627f8237c',
    requestNumber: 'QB-20260724-ABC123',
    phone: '+84901234567',
    vehicleId: vehicle.id,
    startDate,
    endDate,
    status: QuickBookingStatus.NEW,
    smsStatus: QuickBookingSmsStatus.PENDING,
    adminNotes: null,
    handledById: null,
    contactedAt: null,
    smsSentAt: null,
    smsLastAttemptAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    vehicle,
  };
  const prismaMock = {
    vehicle: { findUnique: jest.fn() },
    booking: { count: jest.fn() },
    quickBookingRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const notificationsMock = {
    sendSMS: jest.fn(),
    sendEmail: jest.fn(),
  };
  const configMock = { get: jest.fn() };
  const service = new QuickBookingsService(
    prismaMock as unknown as PrismaService,
    notificationsMock as unknown as NotificationService,
    configMock as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.vehicle.findUnique.mockResolvedValue(vehicle);
    prismaMock.booking.count.mockResolvedValue(0);
    prismaMock.quickBookingRequest.findFirst.mockResolvedValue(null);
    prismaMock.quickBookingRequest.create.mockResolvedValue(quickRequest);
    prismaMock.quickBookingRequest.update.mockResolvedValue(quickRequest);
    notificationsMock.sendSMS.mockResolvedValue(true);
    notificationsMock.sendEmail.mockResolvedValue(undefined);
    configMock.get.mockReturnValue(undefined);
  });

  it('lưu yêu cầu thật trước khi gửi SMS và chuẩn hóa số điện thoại', async () => {
    const result = await service.create({
      phone: '0901234567',
      vehicleId: vehicle.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const createCalls = prismaMock.quickBookingRequest.create.mock
      .calls as unknown as Array<
      [{ data: { phone: string; vehicleId: string } }]
    >;
    expect(createCalls[0]?.[0].data).toMatchObject({
      phone: '+84901234567',
      vehicleId: vehicle.id,
    });
    expect(
      prismaMock.quickBookingRequest.create.mock.invocationCallOrder[0],
    ).toBeLessThan(notificationsMock.sendSMS.mock.invocationCallOrder[0]);
    expect(result).toMatchObject({
      requestNumber: quickRequest.requestNumber,
      smsSent: true,
      reservationConfirmed: false,
    });
  });

  it('không tạo yêu cầu mới khi người dùng gửi trùng trong 10 phút', async () => {
    prismaMock.quickBookingRequest.findFirst.mockResolvedValue({
      ...quickRequest,
      smsStatus: QuickBookingSmsStatus.SENT,
    });

    const result = await service.create({
      phone: '+84901234567',
      vehicleId: vehicle.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    expect(result.duplicate).toBe(true);
    expect(prismaMock.quickBookingRequest.create).not.toHaveBeenCalled();
    expect(notificationsMock.sendSMS).not.toHaveBeenCalled();
  });

  it('từ chối khi lịch xe đã có đơn đang hoạt động', async () => {
    prismaMock.booking.count.mockResolvedValue(1);

    await expect(
      service.create({
        phone: '0901234567',
        vehicleId: vehicle.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.quickBookingRequest.create).not.toHaveBeenCalled();
  });
});
