import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { whitelist } from './common/utils/whitelist.utils';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  if (config.get<string>('ACTIVE_SWAGGER') === 'true') {
    const swagger = new DocumentBuilder()
      .setTitle('MyLibrary Doc')
      .setDescription(
        'Documentação dos metodos que compõem a aplicação. ' +
          'Autentique-se pelo POST /auth/login antes de testar as rotas protegidas.',
      )
      .addCookieAuth(config.get<string>('COOKIE_NAME'))
      .setVersion('1.1.0')
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
    new Logger('Bootstrap').log('Swagger publicado em /docs');
  }

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
