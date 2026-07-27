import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisStore } from 'connect-redis';
import type { RequestHandler } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import passport from 'passport';
import type { RedisClientType } from 'redis';
import { RedisModule } from '../../redis/redis.module';
import { REDIS_SESSION_CLIENT } from '../../redis/redis.provider';

@Module({
  imports: [RedisModule],
})
export class AppMiddlewareModule implements NestModule {
  constructor(
    @Inject(REDIS_SESSION_CLIENT) private readonly redis: RedisClientType,
    private readonly config: ConfigService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const cookieSecureEnv = this.config.get<string>('COOKIE_SECURE');
    const cookieSecure =
      cookieSecureEnv !== undefined
        ? cookieSecureEnv === 'true'
        : this.config.get<string>('NODE_ENV') === 'production';

    const cookieSameSite = (this.config.get<string>('COOKIE_SAMESITE') ??
      'lax') as 'lax' | 'strict' | 'none';

    const redisStore = new RedisStore({
      client: this.redis,
      prefix: 'mylibrary:',
    });

    consumer
      .apply(
        helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }),
        session({
          store: redisStore,
          resave: false,
          saveUninitialized: false,
          secret: this.config.get<string>('SESSION_SECRET')!,
          name: this.config.get<string>('COOKIE_NAME')!,
          cookie: {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: cookieSameSite,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
          },
        }),
        passport.initialize(),
        passport.session() as RequestHandler,
      )
      .forRoutes('*');
  }
}
