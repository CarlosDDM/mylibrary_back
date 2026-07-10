import { Module } from '@nestjs/common';
import {
  redisCacheClientProvider,
  redisSessionClientProvider,
  REDIS_CACHE_CLIENT,
  REDIS_SESSION_CLIENT,
} from './redis.provider';
import { RedisLifecycle } from './redis.lifecycle';

@Module({
  providers: [
    redisCacheClientProvider,
    redisSessionClientProvider,
    RedisLifecycle,
  ],
  exports: [REDIS_CACHE_CLIENT, REDIS_SESSION_CLIENT],
})
export class RedisModule {}
