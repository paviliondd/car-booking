import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../prisma/prisma.service';
import { Vehicle, VehicleStatus } from '@prisma/client';

describe('VehiclesService Unit Tests', () => {
  let service: VehiclesService;
  let prismaMock: {
    vehicle: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    booking: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    // Mock Prisma Service
    prismaMock = {
      vehicle: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      booking: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isHoliday', () => {
    it('should correctly identify Vietnam national holidays', () => {
      const newYear = new Date('2026-01-01');
      const standardDay = new Date('2026-01-15');
      const nationalDay = new Date('2026-09-02');

      expect(service.isHoliday(newYear)).toBe(true);
      expect(service.isHoliday(nationalDay)).toBe(true);
      expect(service.isHoliday(standardDay)).toBe(false);
    });
  });

  describe('calculateTotalPrice (Dynamic Pricing)', () => {
    const mockVehicle: Vehicle = {
      id: 'vehicle-1',
      plateNumber: '30A-111.11',
      brand: 'Toyota',
      model: 'Vios',
      year: 2022,
      seats: 5,
      transmission: 'AUTO',
      fuel: 'GASOLINE',
      color: 'White',
      dailyPrice: 600000, // Ngày thường: 600K
      weekendPrice: 800000, // Cuối tuần: 800K
      holidayPrice: 1000000, // Ngày lễ: 1M
      penaltyRate: 80000,
      images: [],
      videoUrl: null,
      status: VehicleStatus.AVAILABLE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should calculate base price correctly for normal weekdays only', () => {
      // 2026-06-15 (Thứ 2) đến 2026-06-17 (Thứ 4) -> 2 ngày thường
      const start = new Date('2026-06-15T08:00:00.000Z');
      const end = new Date('2026-06-17T08:00:00.000Z');

      const result = service.calculateTotalPrice(mockVehicle, start, end);
      expect(result.totalDays).toBe(2);
      expect(result.totalPrice).toBe(1200000); // 600K * 2
    });

    it('should apply weekend rate for Saturday and Sunday', () => {
      // 2026-06-20 (Thứ Bảy) đến 2026-06-22 (Thứ Hai) -> 2 ngày cuối tuần
      const start = new Date('2026-06-20T08:00:00.000Z');
      const end = new Date('2026-06-22T08:00:00.000Z');

      const result = service.calculateTotalPrice(mockVehicle, start, end);
      expect(result.totalDays).toBe(2);
      expect(result.totalPrice).toBe(1600000); // 800K * 2
    });

    it('should apply holiday rate for Vietnam National Day (Sept 2nd)', () => {
      // 2026-09-02 (Thứ Tư - Lễ) đến 2026-09-03 (Thứ Năm) -> 1 ngày lễ
      const start = new Date('2026-09-02T08:00:00.000Z');
      const end = new Date('2026-09-03T08:00:00.000Z');

      const result = service.calculateTotalPrice(mockVehicle, start, end);
      expect(result.totalDays).toBe(1);
      expect(result.totalPrice).toBe(1000000); // 1M
    });

    it('should throw error if start date is after end date', () => {
      const start = new Date('2026-06-15');
      const end = new Date('2026-06-14');

      expect(() =>
        service.calculateTotalPrice(mockVehicle, start, end),
      ).toThrow();
    });
  });

  describe('findAvailable', () => {
    it('uses the same public catalogue rules for dated searches', async () => {
      prismaMock.booking.findMany.mockResolvedValue([
        { vehicleId: 'busy-vehicle' },
      ]);
      prismaMock.vehicle.findMany.mockResolvedValue([]);

      await service.findAvailable(
        '2026-07-24T09:00:00.000Z',
        '2026-07-25T08:00:00.000Z',
        {},
      );

      expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith({
        where: {
          status: VehicleStatus.AVAILABLE,
          id: { notIn: ['busy-vehicle'] },
          images: { isEmpty: false },
        },
        orderBy: [{ updatedAt: 'desc' }],
      });
    });
  });
});
