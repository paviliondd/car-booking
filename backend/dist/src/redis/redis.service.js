"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
let RedisService = RedisService_1 = class RedisService {
    configService;
    client = null;
    isReady = false;
    logger = new common_1.Logger(RedisService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const url = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        const client = (0, redis_1.createClient)({
            url,
            socket: {
                connectTimeout: 1500,
                reconnectStrategy: false,
            },
        });
        client.on('error', (err) => {
            this.isReady = false;
            this.logger.warn(`Redis unavailable: ${err.message}`);
        });
        try {
            await Promise.race([
                client.connect(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 2000)),
            ]);
            this.client = client;
            this.isReady = true;
            this.logger.log('Redis connected successfully.');
        }
        catch (error) {
            this.isReady = false;
            this.client = null;
            this.logger.warn(`${error instanceof Error ? error.message : 'Redis connection failed'}. Continuing without Redis.`);
            try {
                await client.disconnect();
            }
            catch {
            }
        }
    }
    async onModuleDestroy() {
        if (this.client && this.isReady) {
            await this.client.quit();
        }
    }
    async get(key) {
        if (!this.client || !this.isReady)
            return null;
        return await this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (!this.client || !this.isReady)
            return;
        if (ttlSeconds) {
            await this.client.set(key, value, { EX: ttlSeconds });
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        if (!this.client || !this.isReady)
            return;
        await this.client.del(key);
    }
    async acquireLock(key, ttlMs) {
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
        }
        catch (error) {
            this.logger.error(`Failed to acquire lock for ${key}`, error);
            return false;
        }
    }
    async releaseLock(key) {
        if (!this.client || !this.isReady)
            return;
        await this.client.del(`lock:${key}`);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map