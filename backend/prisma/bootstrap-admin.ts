import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Quản trị datxe';

if (!databaseUrl) throw new Error('DATABASE_URL is required.');
if (!adminEmail) throw new Error('ADMIN_EMAIL is required.');
if (!adminPassword || adminPassword.length < 12) {
  throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const email: string = adminEmail;
const password: string = adminPassword;

async function main() {
  const passwordHash: string = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name, password: passwordHash, role: Role.ADMIN },
    create: { email, name, password: passwordHash, role: Role.ADMIN },
  });
  console.log(`Admin account is ready: ${email}`);
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
