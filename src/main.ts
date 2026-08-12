import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { whitelist } from './common/utils/whitelist.utils';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const logger = new Logger('Bootstrap');

const STAGE_WARN_INTERVAL_MS = 10_000;

async function stage<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  const startedAt = Date.now();
  logger.log(`[etapa:início] ${name}`);

  const watchdog = setInterval(() => {
    logger.warn(
      `[etapa:lenta] "${name}" ainda em execução após ${Math.round((Date.now() - startedAt) / 1000)}s`,
    );
  }, STAGE_WARN_INTERVAL_MS);
  watchdog.unref();

  try {
    const result = await fn();
    logger.log(`[etapa:ok] ${name} (${Date.now() - startedAt}ms)`);
    return result;
  } catch (err) {
    logger.error(`[etapa:falha] ${name} após ${Date.now() - startedAt}ms`, err);
    throw err;
  } finally {
    clearInterval(watchdog);
  }
}

function registerProcessListeners() {
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', err);
  });

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => logger.warn(`Sinal ${signal} recebido`));
  }

  process.on('exit', (code) =>
    logger.warn(`Processo encerrando (code=${code})`),
  );
}

function logEnvironment() {
  const env = process.env;
  logger.log(
    [
      `node=${process.version}`,
      `pid=${process.pid}`,
      `pm2_id=${env.pm_id ?? '-'}`,
      `cwd=${process.cwd()}`,
      `NODE_ENV=${env.NODE_ENV ?? '-'}`,
      `PORT=${env.PORT ?? 3000}`,
    ].join(' '),
  );
  logger.log(
    [
      `postgres=${env.DB_HOST ?? '-'}:${env.DB_PORT ?? '-'}/${env.POSTGRES_DB ?? '-'}`,
      `redis_cache=${env.REDIS_CACHE_HOST ?? '-'}:${env.REDIS_CACHE_PORT ?? '-'}`,
      `redis_session=${env.REDIS_SESSION_HOST ?? '-'}:${env.REDIS_SESSION_PORT ?? '-'}`,
      `s3=${env.S3_API_URL || '-'}`,
      `swagger=${env.ACTIVE_SWAGGER ?? 'false'}`,
      `trust_proxy=${env.TRUST_PROXY || '-'}`,
    ].join(' '),
  );
}

async function bootstrap() {
  const bootStartedAt = Date.now();

  registerProcessListeners();
  logEnvironment();

  const isProd = process.env.NODE_ENV === 'production';
  const logLevels: LogLevel[] = isProd
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await stage('Criando aplicação Nest (AppModule)', () =>
    NestFactory.create<NestExpressApplication>(AppModule, {
      logger: logLevels,
      abortOnError: false,
    }),
  );

  const config = app.get(ConfigService);

  if (config.get<string>('ACTIVE_SWAGGER') === 'true') {
    await stage('Publicando Swagger em /docs', () => {
      const swagger = new DocumentBuilder()
        .setTitle('MyLibrary Doc')
        .setDescription(
          'Documentação dos metodos que compõem a aplicação. ' +
            'Autentique-se pelo POST /auth/login antes de testar as rotas protegidas.',
        )
        .addCookieAuth(config.get<string>('COOKIE_NAME'))
        .setVersion('1.2.0')
        .addTag('auth', 'Login, logout e sessão do usuário')
        .addTag('health', 'Probes de liveness e readiness')
        .addTag('works', 'Obras e suas capas')
        .addTag('series', 'Séries')
        .addTag('franchises', 'Franquias')
        .addTag('authors', 'Autores')
        .addTag('illustrators', 'Ilustradores')
        .addTag('search', 'Busca global')
        .addTag('dashboard', 'Estatísticas')
        .addTag('options', 'Listas de apoio para formulários')
        .addTag('users', 'Gestão de usuários (majoritariamente ADMIN)')
        .build();
      const documentFactory = () => SwaggerModule.createDocument(app, swagger);
      SwaggerModule.setup('docs', app, documentFactory, {
        swaggerOptions: { withCredentials: true },
      });
    });
  } else {
    logger.log('Swagger desativado (ACTIVE_SWAGGER != true)');
  }

  const trustProxy = config.get<string>('TRUST_PROXY');
  if (trustProxy) {
    const parsed =
      trustProxy === 'true' ? true : Number(trustProxy) || trustProxy;
    app.set('trust proxy', parsed);
    logger.log(`trust proxy configurado: ${String(parsed)}`);
  }

  const origins = whitelist();
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  logger.log(`CORS liberado para: ${origins?.join(', ') || '(não definido)'}`);

  app.enableShutdownHooks();
  logger.log('Shutdown hooks habilitados');

  const port = process.env.PORT ?? 3000;
  await stage(`Abrindo servidor HTTP na porta ${port}`, () => app.listen(port));

  logger.log(
    `Aplicação pronta em ${await app.getUrl()} (boot total ${Date.now() - bootStartedAt}ms)`,
  );
}

bootstrap().catch((err) => {
  logger.error('Falha ao iniciar a aplicação', err);
  process.exit(1);
});
