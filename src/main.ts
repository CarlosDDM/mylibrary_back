import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { whitelist } from './common/utils/whitelist.utils';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  const isProd = config.get<string>('NODE_ENV') === 'production';
  const logLevels: LogLevel[] = isProd
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];
  app.useLogger(logLevels);

  const trustProxy = config.get<string>('TRUST_PROXY');
  if (trustProxy) {
    const parsed =
      trustProxy === 'true' ? true : Number(trustProxy) || trustProxy;
    app.set('trust proxy', parsed);
  }

  app.enableCors({
    origin: whitelist(),
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error('Falha ao iniciar a aplicação', err);
  process.exit(1);
});
