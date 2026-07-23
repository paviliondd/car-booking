import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private isReady = false;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const client = createClient({
      url,
      socket: {
        connectTimeout: 1500,
        reconnectStrategy: false,
      },
    });

    client.on('error', (err: Error) => {
      this.isReady = false;
      this.logger.warn(`Redis unavailable: ${err.message}`);
    });

    let connectionTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        client.connect(),
        new Promise(
          (_, reject) =>
            (connectionTimer = setTimeout(
              () => reject(new Error('Redis connection timeout')),
              2000,
            )),
        ),
      ]);
      this.client = client;
      this.isReady = true;
      this.logger.log('Redis connected successfully.');
    } catch (error) {
      this.isReady = false;
      this.client = null;
      this.logger.warn(
        `${error instanceof Error ? error.message : 'Redis connection failed'}. Continuing without Redis.`,
      );
      try {
        await client.disconnect();
      } catch {
        // Ignore disconnect failures when the socket never opened.
      }
    } finally {
      if (connectionTimer) clearTimeout(connectionTimer);
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isReady) {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isReady) return null;
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isReady) return;
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isReady) return;
    await this.client.del(key);
  }

  async increment(key: string, ttlSeconds: number): Promise<number | null> {
    if (!this.client || !this.isReady) return null;
    const value = await this.client.incr(key);
    if (value === 1) await this.client.expire(key, ttlSeconds);
    return value;
  }

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    if (!this.client || !this.isReady) {
      this.logger.warn(`Redis lock skipped for ${key}; Redis is unavailable.`);
      return true;
    }

    try {
      const lockKey = `lock:${key}`;
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
    if (!this.client || !this.isReady) return;
    await this.client.del(`lock:${key}`);
  }
}
