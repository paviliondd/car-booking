import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = createClient({ url });
    this.client.on('error', (err) => this.logger.error('Redis Client Error', err));
    await this.client.connect();
    this.logger.log('Redis connected successfully.');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Chống trùng lịch bằng Khóa phân tán (Distributed Lock)
  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    try {
      const lockKey = `lock:${key}`;
      // SET key value NX PX ttl
      const result = await this.client.set(lockKey, 'locked', {
        NX: true,
        PX: ttlMs,
      });
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to acquire lock for ${key}`, error);
      return false;
    }
  }

  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.client.del(lockKey);
  }
}
