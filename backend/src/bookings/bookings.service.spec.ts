import {
  BookingStatus,
  CustomerSegment,
  PaymentMethod,
  PaymentStatus,
  QuickBookingStatus,
  Role,
  VehicleStatus,
} from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { NotificationService } from '../notification/notification.service';
import type { PaymentsService } from '../payments/payments.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { RedisService } from '../redis/redis.service';
import type { LocalStorageService } from '../storage/local-storage.service';
import type { VehiclesService } from '../vehicles/vehicles.service';
import type { ConfigService } from '@nestjs/config';
import { BookingsService } from './bookings.service';

describe('BookingsService admin creation', () => {
  const actor: AuthenticatedUser = {
    id: '66d35cbd-8e97-46d7-87bd-b487c87ea935',
    email: 'admin@datxe.local',
    phone: '+84900000001',
    phoneVerifiedAt: new Date(),
    name: 'Admin',
    role: Role.ADMIN,
  };
  const vehicle = {
    id: '5d0e689e-dd1c-495c-a59f-606ed75b2504',
    brand: 'Toyota',
    model: 'Vios',
    plateNumber: '86A-12345',
    status: VehicleStatus.AVAILABLE,
  };
  const customer = {
    id: '3fd79d24-020f-41c5-872b-876766fc4fc2',
    userId: null,
    phone: '+84901234567',
    fullName: 'Nguyễn Văn A',
    idCardNo: null,
    idCardFront: null,
    idCardBack: null,
    driverLicense: null,
    segment: CustomerSegment.REGULAR,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    affiliateId: null,
  };
  const source = {
    id: 'f5eb56cf-24b1-4682-b4ef-d13627f8237c',
    status: QuickBookingStatus.CONTACTED,
    bookingId: null,
    booking: null,
    contactedAt: new Date(),
  };
  const booking = {
    id: 'a3fc82e0-1053-42b0-b6e1-0bdb8c47522c',
    bookingNumber: 'BK-123456-78',
    customerId: customer.id,
    vehicleId: vehicle.id,
    startDate: new Date('2027-01-10T01:00:00.000Z'),
    endDate: new Date('2027-01-12T11:00:00.000Z'),
    pickupLocation: 'La Gi',
    dropoffLocation: 'La Gi',
    totalDays: 3,
    basePrice: 1_800_000,
    discountAmount: 0,
    totalPrice: 1_800_000,
    status: BookingStatus.PENDING,
    notes: null,
    couponCode: null,
    staffId: actor.id,
    insuranceType: 'NONE',
    insuranceFee: 0,
    depositPercent: 30,
    depositAmount: 540_000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const payment = {
    id: '181fe4c6-15e7-47a3-ac04-b8c3fe51962a',
    bookingId: booking.id,
    amount: 540_000,
    status: PaymentStatus.UNPAID,
    method: PaymentMethod.CASH,
  };

  const prismaMock = {
    vehicle: { findUnique: jest.fn() },
    quickBookingRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: { findFirst: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn() },
    customer: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: { create: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const redisMock = {
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
  };
  const vehiclesMock = { calculateTotalPrice: jest.fn() };
  const notificationsMock = { sendSMS: jest.fn() };
  const service = new BookingsService(
    prismaMock as unknown as PrismaService,
    redisMock as unknown as RedisService,
    vehiclesMock as unknown as VehiclesService,
    {} as PaymentsService,
    notificationsMock as unknown as NotificationService,
    {} as LocalStorageService,
    { get: jest.fn() } as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.vehicle.findUnique.mockResolvedValue(vehicle);
    prismaMock.quickBookingRequest.findUnique.mockResolvedValue(source);
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.customer.findMany.mockResolvedValue([]);
    prismaMock.customer.create.mockResolvedValue(customer);
    prismaMock.booking.create.mockResolvedValue(booking);
    prismaMock.payment.create.mockResolvedValue(payment);
    prismaMock.quickBookingRequest.update.mockResolvedValue({
      ...source,
      status: QuickBookingStatus.CLOSED,
      bookingId: booking.id,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
      },
    });
    prismaMock.auditLog.create.mockResolvedValue({});
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
        callback(prismaMock),
    );
    redisMock.acquireLock.mockResolvedValue(true);
    redisMock.releaseLock.mockResolvedValue(undefined);
    vehiclesMock.calculateTotalPrice.mockReturnValue({
      totalPrice: 1_800_000,
      totalDays: 3,
      details: [],
    });
    notificationsMock.sendSMS.mockResolvedValue(false);
  });

  it('creates a real booking/payment and closes the quick request atomically', async () => {
    const result = await service.createAdminBooking(
      {
        fullName: customer.fullName,
        phone: '0901234567',
        vehicleId: vehicle.id,
        startDate: '2027-01-10T08:00:00+07:00',
        endDate: '2027-01-12T18:00:00+07:00',
        paymentMethod: PaymentMethod.CASH,
        insuranceType: 'NONE',
        depositPercent: 30,
        quickBookingRequestId: source.id,
      },
      actor,
    );

    const bookingCreateCalls = prismaMock.booking.create.mock
      .calls as unknown as Array<
      [
        {
          data: {
            customerId: string;
            vehicleId: string;
            staffId: string;
            status: BookingStatus;
            totalPrice: number;
          };
        },
      ]
    >;
    expect(bookingCreateCalls[0]?.[0].data).toMatchObject({
      customerId: customer.id,
      vehicleId: vehicle.id,
      staffId: actor.id,
      status: BookingStatus.PENDING,
      totalPrice: 1_800_000,
    });
    const paymentCreateCalls = prismaMock.payment.create.mock
      .calls as unknown as Array<
      [
        {
          data: {
            bookingId: string;
            amount: number;
            status: PaymentStatus;
            method: PaymentMethod;
          };
        },
      ]
    >;
    expect(paymentCreateCalls[0]?.[0].data).toMatchObject({
      bookingId: booking.id,
      amount: 540_000,
      status: PaymentStatus.UNPAID,
      method: PaymentMethod.CASH,
    });
    const requestUpdateCalls = prismaMock.quickBookingRequest.update.mock
      .calls as unknown as Array<
      [
        {
          where: { id: string };
          data: {
            bookingId: string;
            status: QuickBookingStatus;
            handledById: string;
          };
        },
      ]
    >;
    expect(requestUpdateCalls[0]?.[0]).toMatchObject({
      where: { id: source.id },
      data: {
        bookingId: booking.id,
        status: QuickBookingStatus.CLOSED,
        handledById: actor.id,
      },
    });
    expect(result.booking.id).toBe(booking.id);
    expect(result.quickBookingRequest?.bookingId).toBe(booking.id);
    expect(redisMock.releaseLock).toHaveBeenCalledWith(`vehicle:${vehicle.id}`);
  });
});
