import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { RedisClientType } from 'redis';
import {
  REDIS_CACHE_CLIENT,
  REDIS_SESSION_CLIENT,
} from 'src/redis/redis.provider';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(REDIS_CACHE_CLIENT)
    private readonly redisCache: RedisClientType,
    @Inject(REDIS_SESSION_CLIENT)
    private readonly redisSession: RedisClientType,
  ) {}

  checkCache(key: string, timeoutMs = 2000) {
    return this.ping(key, this.redisCache, timeoutMs);
  }

  checkSession(key: string, timeoutMs = 2000) {
    return this.ping(key, this.redisSession, timeoutMs);
  }

  private async ping(key: string, client: RedisClientType, timeoutMs: number) {
    const indicador = this.healthIndicatorService.check(key);
    const inicio = Date.now();

    try {
      const pong = await this.comTimeout(client.ping(), timeoutMs);

      if (pong !== 'PONG') {
        return indicador.down({ message: `resposta inesperada: ${pong}` });
      }

      return indicador.up({ responseTime: Date.now() - inicio });
    } catch (err: unknown) {
      return indicador.down({
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promessa,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`timeout de ${ms}ms`)), ms).unref();
      }),
    ]);
  }
}
