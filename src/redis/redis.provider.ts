import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export const REDIS_CACHE_CLIENT = Symbol('REDIS_CACHE_CLIENT');
export const REDIS_SESSION_CLIENT = Symbol('REDIS_SESSION_CLIENT');

type RedisHostPrefix = 'REDIS_SESSION' | 'REDIS_CACHE';

type RedisClientConfig = {
  label: string;
  prefix: RedisHostPrefix;
  disableOfflineQueue: boolean;
};

const createRedisClient = async (
  config: ConfigService,
  { label, prefix, disableOfflineQueue }: RedisClientConfig,
) => {
  const logger = new Logger(`Redis:${label}`);
  const host = config.get<string>(`${prefix}_HOST`);
  const port = Number(config.get(`${prefix}_PORT`));

  const client = createClient({
    url: `redis://${host}:${port}`,
    disableOfflineQueue,
  });

  client.on('error', (err) => logger.error('Erro no cliente Redis', err));
  await client.connect();

  return client;
};

export const redisCacheClientProvider: Provider = {
  provide: REDIS_CACHE_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    createRedisClient(config, {
      label: 'cache',
      prefix: 'REDIS_CACHE',
      disableOfflineQueue: true,
    }),
};

export const redisSessionClientProvider: Provider = {
  provide: REDIS_SESSION_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    createRedisClient(config, {
      label: 'session',
      prefix: 'REDIS_SESSION',
      disableOfflineQueue: false,
    }),
};
