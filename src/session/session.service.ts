import { Inject, Injectable, Logger } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { REDIS_SESSION_CLIENT } from '../redis/redis.provider';

const SESSION_PREFIX = 'mylibrary:';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @Inject(REDIS_SESSION_CLIENT) private readonly redis: RedisClientType,
  ) {}

  async destroyUserSessions(userId: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const { cursor: next, keys } = await this.redis.scan(cursor, {
          MATCH: `${SESSION_PREFIX}*`,
          COUNT: 100,
        });
        cursor = next;

        if (keys.length === 0) continue;

        const values = await this.redis.mGet(keys);
        const toDelete = keys.filter((_, i) => {
          const raw = values[i];
          if (!raw) return false;
          try {
            const session = JSON.parse(raw) as {
              passport?: { user?: { userId?: string } };
            };
            return session.passport?.user?.userId === userId;
          } catch {
            return false;
          }
        });

        if (toDelete.length > 0) {
          await this.redis.del(toDelete);
        }
      } while (cursor !== '0');
    } catch (err: unknown) {
      this.logger.error(
        `destroyUserSessions falhou para "${userId}": ${String(err)}`,
      );
    }
  }
}
