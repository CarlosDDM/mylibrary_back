import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export const REDIS_CACHE_CLIENT = Symbol('REDIS_CACHE_CLIENT');
export const REDIS_SESSION_CLIENT = Symbol('REDIS_SESSION_CLIENT');

type RedisClientConfig = {
  label: string;
  database: number;
  disableOfflineQueue: boolean;
};

const createRedisClient = async (
  config: ConfigService,
  { label, database, disableOfflineQueue }: RedisClientConfig,
) => {
  const logger = new Logger(`Redis:${label}`);

  const client = createClient({
    socket: {
      host: config.get<string>('REDIS_HOST'),
      port: Number(config.get('REDIS_PORT')),
    },
    password: config.get<string>('REDIS_PASSWORD') || undefined,
    database,
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
      database: 1,
      disableOfflineQueue: true,
    }),
};

export const redisSessionClientProvider: Provider = {
  provide: REDIS_SESSION_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    createRedisClient(config, {
      label: 'session',
      database: 0,
      disableOfflineQueue: false,
    }),
};
