import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import type { RedisClientType } from 'redis';
import { REDIS_CACHE_CLIENT } from '../redis/redis.provider';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(REDIS_CACHE_CLIENT) private readonly redis: RedisClientType,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value ?? null;
    } catch (err: unknown) {
      this.logger.warn(`Cache GET falhou para "${key}": ${String(err)}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttlMs);
    } catch (err: unknown) {
      this.logger.warn(`Cache SET falhou para "${key}": ${String(err)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (err: unknown) {
      this.logger.error(
        `Cache DEL falhou para "${key}", dado obsoleto pode ser servido: ${String(err)}`,
      );
    }
  }

  wrap<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
    return this.cacheManager.wrap(key, fn, ttlMs);
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const reply = await this.redis.scan(cursor, {
          MATCH: `${prefix}*`,
          COUNT: 100,
        });
        cursor = reply.cursor;
        if (reply.keys.length > 0) {
          await this.redis.del(reply.keys);
        }
      } while (cursor !== '0');
    } catch (err: unknown) {
      this.logger.error(
        `Cache invalidateByPrefix falhou para "${prefix}": ${String(err)}`,
      );
    }
  }
}
