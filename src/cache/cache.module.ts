import { Module } from '@nestjs/common';
import { CacheModule as CacheModuleRegister } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import type { RedisClientType } from 'redis';
import { CacheService } from './cache.service';
import { RedisModule } from '../redis/redis.module';
import { REDIS_CACHE_CLIENT } from '../redis/redis.provider';
import { DYNAMIC_TTL_MS } from './cache.constants';

@Module({
  imports: [
    RedisModule,
    CacheModuleRegister.registerAsync({
      imports: [RedisModule],
      inject: [REDIS_CACHE_CLIENT],
      useFactory: (client: RedisClientType) => ({
        stores: new KeyvRedis(client),
        ttl: DYNAMIC_TTL_MS,
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
