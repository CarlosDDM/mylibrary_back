import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  Logger,
  LogLevel,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import passport from 'passport';
import type { RedisClientType } from 'redis';
import { REDIS_SESSION_CLIENT } from './redis/redis.provider';
import { whitelist } from './common/utils/whitelist.utils';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const isProd = config.get<string>('NODE_ENV') === 'production';
  const logLevels: LogLevel[] = isProd
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];
  app.useLogger(logLevels);

  const trustProxy = config.get<string>('TRUST_PROXY');
  if (trustProxy) {
    app.set('trust proxy', Number(trustProxy) || trustProxy);
  }

  const cookieSecureEnv = config.get<string>('COOKIE_SECURE');
  const cookieSecure =
    cookieSecureEnv !== undefined
      ? cookieSecureEnv === 'true'
      : config.get<string>('NODE_ENV') === 'production';

  const cookieSameSite = (config.get<string>('COOKIE_SAMESITE') ?? 'lax') as
    'lax' | 'strict' | 'none';

  const redisClient = app.get<RedisClientType>(REDIS_SESSION_CLIENT);

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'mylibrary:',
  });

  app.enableCors({
    origin: whitelist(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );

  app.use(
    session({
      store: redisStore,
      resave: false,
      saveUninitialized: false,
      secret: config.get<string>('SESSION_SECRET')!,
      name: config.get<string>('COOKIE_NAME')!,
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error('Falha ao iniciar a aplicação', err);
  process.exit(1);
});
