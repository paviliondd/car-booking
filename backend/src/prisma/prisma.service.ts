import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool | null = null;
  private isConfigured = true;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || dbUrl.trim() === '') {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const pool = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter, log: ['error', 'warn'] });
    this.pool = pool;
  }

  async onModuleInit() {
    if (!this.isConfigured || !this.pool) {
      this.logger.warn(
        'PrismaClient skipped connection: Database is not configured.',
      );
      return;
    }

    try {
      // Test pg Pool connection with timeout before calling Prisma $connect
      const client = await this.pool.connect();
      client.release();

      await this.$connect();
      this.logger.log(
        'Prisma successfully connected to PostgreSQL database using pg Driver Adapter.',
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to establish database connection during initialization: ${error instanceof Error ? error.message : String(error)}`,
      );
      // We do not rethrow the error, letting NestJS boot successfully so Nginx reverse proxy doesn't trigger 502/crash loop.
      // The system will try to connect lazily when client queries are executed.
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Successfully closed PostgreSQL connection pool.');
    }
  }
}
