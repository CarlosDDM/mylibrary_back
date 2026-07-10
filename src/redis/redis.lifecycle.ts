import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { REDIS_CACHE_CLIENT, REDIS_SESSION_CLIENT } from './redis.provider';

@Injectable()
export class RedisLifecycle implements OnApplicationShutdown {
  private readonly logger = new Logger('Redis');

  constructor(
    @Inject(REDIS_CACHE_CLIENT) private readonly cacheClient: RedisClientType,
    @Inject(REDIS_SESSION_CLIENT)
    private readonly sessionClient: RedisClientType,
  ) {}

  async onApplicationShutdown() {
    const openClients = [this.cacheClient, this.sessionClient].filter(
      (client) => client.isOpen,
    );

    const results = await Promise.allSettled(
      openClients.map((client) => client.close()),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn('Falha ao encerrar cliente Redis', result.reason);
      }
    }
  }
}
