import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { maskPhone, normalizeVietnamesePhone } from '../src/common/phone';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const adminPhoneInput = process.env.ADMIN_PHONE?.trim();
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || undefined;
const adminPassword = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Quản trị datxe';

if (!databaseUrl) throw new Error('DATABASE_URL is required.');
if (!adminPhoneInput) throw new Error('ADMIN_PHONE is required.');
if (!adminPassword || adminPassword.length < 12) {
  throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
}

const adminPhone = normalizeVietnamesePhone(adminPhoneInput);
const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const password: string = adminPassword;

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const matches = await prisma.user.findMany({
    where: {
      OR: [
        { phone: adminPhone },
        ...(adminEmail ? [{ email: adminEmail }] : []),
      ],
    },
  });
  if (matches.length > 1) {
    throw new Error(
      'ADMIN_PHONE and ADMIN_EMAIL belong to different accounts. Resolve the conflict before bootstrap.',
    );
  }

  if (matches[0]) {
    await prisma.user.update({
      where: { id: matches[0].id },
      data: {
        phone: adminPhone,
        phoneVerifiedAt: matches[0].phoneVerifiedAt || new Date(),
        ...(adminEmail ? { email: adminEmail } : {}),
        name,
        password: passwordHash,
        role: Role.ADMIN,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        phone: adminPhone,
        phoneVerifiedAt: new Date(),
        email: adminEmail,
        name,
        password: passwordHash,
        role: Role.ADMIN,
      },
    });
  }
  console.log(`Admin account is ready: ${maskPhone(adminPhone)}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
