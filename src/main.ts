import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const redisClient = createClient({
    socket: {
      host: config.get<string>('REDIS_HOST'),
      port: config.get<number>('REDIS_PORT'),
    },
    password: config.get<string>('REDIS_PASSWORD'),
  });
  redisClient.connect().catch(console.error);

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
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: config.get<string>('SESSION_SECRET')!,
      cookie: {
        httpOnly: true, // JS can't read the cookie (XSS protection)
        secure: config.get<string>('NODE_ENV') === 'production', // HTTPS only in prod
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
