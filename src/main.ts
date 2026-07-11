import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import passport from 'passport';
import type { RedisClientType } from 'redis';
import { REDIS_SESSION_CLIENT } from './redis/redis.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const redisClient = app.get<RedisClientType>(REDIS_SESSION_CLIENT);

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'mylibrary:',
  });

  app.enableCors({
    origin: 'http://localhost:4200',
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
        // secure: false,
        secure: config.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
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
