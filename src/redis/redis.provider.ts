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

const SOCKET_CONNECT_TIMEOUT_MS = 5_000;
const FIRST_CONNECT_TIMEOUT_MS = 20_000;

const createRedisClient = async (
  config: ConfigService,
  { label, prefix, disableOfflineQueue }: RedisClientConfig,
) => {
  const logger = new Logger(`Redis:${label}`);
  const host = config.get<string>(`${prefix}_HOST`);
  const port = Number(config.get(`${prefix}_PORT`));
  const url = `redis://${host}:${port}`;

  const client = createClient({
    url,
    disableOfflineQueue,
    socket: {
      connectTimeout: SOCKET_CONNECT_TIMEOUT_MS,
      reconnectStrategy: (retries, cause) => {
        const delay = Math.min(100 * 2 ** retries, 3_000);
        logger.warn(
          `Reconectando a ${url} (tentativa ${retries + 1}, próxima em ${delay}ms): ${String(cause)}`,
        );
        return delay;
      },
    },
  });

  client.on('error', (err) => logger.error('Erro no cliente Redis', err));
  client.on('ready', () => logger.log(`Cliente pronto (${url})`));
  client.on('end', () => logger.warn(`Conexão encerrada (${url})`));

  logger.log(`Conectando em ${url} (offlineQueue=${!disableOfflineQueue})`);
  const startedAt = Date.now();

  let timeoutId: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () =>
            reject(
              new Error(
                `Timeout de ${FIRST_CONNECT_TIMEOUT_MS}ms conectando em ${url}`,
              ),
            ),
          FIRST_CONNECT_TIMEOUT_MS,
        );
        timeoutId.unref();
      }),
    ]);
  } catch (err) {
    logger.error(
      `Falha ao conectar em ${url} após ${Date.now() - startedAt}ms`,
      err,
    );
    if (client.isOpen) {
      client.destroy();
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  logger.log(`Conectado em ${url} (${Date.now() - startedAt}ms)`);

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
