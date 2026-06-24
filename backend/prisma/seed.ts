import { PrismaClient, Role, VehicleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Tạo Users
  const adminPassword = await bcrypt.hash('adminpassword123', 10);
  const staffPassword = await bcrypt.hash('staffpassword123', 10);
  const customerPassword = await bcrypt.hash('customerpassword123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@datxe.linuxunity.com' },
    update: {},
    create: {
      email: 'admin@datxe.linuxunity.com',
      password: adminPassword,
      name: 'Chủ Xe Admin',
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@datxe.linuxunity.com' },
    update: {},
    create: {
      email: 'staff@datxe.linuxunity.com',
      password: staffPassword,
      name: 'Nhân Viên CSKH',
      role: Role.STAFF,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {},
    create: {
      email: 'customer@gmail.com',
      password: customerPassword,
      name: 'Nguyễn Văn Khách',
      role: Role.CUSTOMER,
      customer: {
        create: {
          phone: '0987654321',
          fullName: 'Nguyễn Văn Khách',
          idCardNo: '037200123456',
        },
      },
    },
  });

  console.log('Users seeded:', { admin: admin.email, staff: staff.email });

  // 2. Tạo Vehicles
  const vehiclesData = [
    {
      plateNumber: '30A-999.99',
      brand: 'VinFast',
      model: 'VF8',
      year: 2023,
      seats: 5,
      transmission: 'AUTO',
      fuel: 'ELECTRIC',
      color: 'Black',
      dailyPrice: 1200000,
      weekendPrice: 1500000,
      holidayPrice: 1800000,
      penaltyRate: 150000,
      images: ['https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80'],
      status: VehicleStatus.AVAILABLE,
    },
    {
      plateNumber: '51G-123.45',
      brand: 'Toyota',
      model: 'Vios',
      year: 2022,
      seats: 5,
      transmission: 'MANUAL',
      fuel: 'GASOLINE',
      color: 'Silver',
      dailyPrice: 600000,
      weekendPrice: 750000,
      holidayPrice: 900000,
      penaltyRate: 80000,
      images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'],
      status: VehicleStatus.AVAILABLE,
    },
    {
      plateNumber: '43C-888.88',
      brand: 'Kia',
      model: 'Carnival',
      year: 2023,
      seats: 7,
      transmission: 'AUTO',
      fuel: 'DIESEL',
      color: 'White',
      dailyPrice: 1800000,
      weekendPrice: 2200000,
      holidayPrice: 2600000,
      penaltyRate: 200000,
      images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'],
      status: VehicleStatus.AVAILABLE,
    },
    {
      plateNumber: '30E-444.55',
      brand: 'Hyundai',
      model: 'Accent',
      year: 2021,
      seats: 5,
      transmission: 'AUTO',
      fuel: 'GASOLINE',
      color: 'Red',
      dailyPrice: 700000,
      weekendPrice: 850000,
      holidayPrice: 1000000,
      penaltyRate: 90000,
      images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80'],
      status: VehicleStatus.AVAILABLE,
    },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const dbVehicle = await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: {},
      create: v,
    });
    vehicles.push(dbVehicle);
  }
  console.log(`Vehicles seeded: ${vehicles.length} cars`);

  // 3. Tạo Coupons
  const couponsData = [
    {
      code: 'CHAOHE2026',
      discountType: 'PERCENTAGE',
      value: 10,
      minOrderValue: 1000000,
      maxDiscount: 200000,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      usageLimit: 100,
    },
    {
      code: 'GIAM50K',
      discountType: 'FIXED_AMOUNT',
      value: 50000,
      minOrderValue: 500000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      usageLimit: 500,
    },
  ];

  for (const c of couponsData) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log('Coupons seeded');

  // 4. Tạo Bảo dưỡng mẫu & Chi phí mẫu
  if (vehicles.length > 0) {
    const v1 = vehicles[0];
    const v2 = vehicles[1];

    await prisma.maintenance.create({
      data: {
        vehicleId: v1.id,
        type: 'OIL_CHANGE',
        scheduledDate: new Date(),
        completedDate: new Date(),
        cost: 800000,
        description: 'Thay nhớt định kỳ Castrol Magnatec',
      },
    });

    await prisma.expense.create({
      data: {
        vehicleId: v1.id,
        category: 'MAINTENANCE',
        amount: 800000,
        date: new Date(),
        description: 'Thay nhớt định kỳ Castrol Magnatec',
      },
    });

    await prisma.maintenance.create({
      data: {
        vehicleId: v2.id,
        type: 'INSPECTION',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 ngày nữa
        description: 'Đăng kiểm định kỳ tại trạm 29-03S',
      },
    });

    console.log('Maintenance schedules and expenses seeded');
  }

  // 5. Tạo Affiliate
  await prisma.affiliate.upsert({
    where: { code: 'CTV999' },
    update: {},
    create: {
      code: 'CTV999',
      userId: admin.id, // CTV liên kết với tài khoản
      commissionRate: 0.05,
      balance: 150000,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
