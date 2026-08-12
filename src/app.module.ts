import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksModule } from './works/works.module';
import { SeriesModule } from './series/series.module';
import { FranchisesModule } from './franchises/franchises.module';
import { AuthorsModule } from './authors/authors.module';
import { IllustratorsModule } from './illustrators/illustrators.module';
import { UsersModule } from './users/users.module';
import { OptionsModule } from './options/options.module';
import { StatusModule } from './status/status.module';
import { MediasModule } from './medias/medias.module';
import { LanguagesModule } from './languages/languages.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { RedisModule } from './redis/redis.module';
import { FileModule } from './file/file.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  Reflector,
} from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppMiddlewareModule } from './common/middleware/app-middleware.module';
import { envValidationSchema } from './config/env.validation';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        const port = configService.get<number>('DB_PORT');
        const database = configService.get<string>('POSTGRES_DB');
        const username = configService.get<string>('POSTGRES_USER');
        const synchronize =
          configService.get<string>('NODE_ENV') !== 'production';

        new Logger('TypeORM').log(
          `Conectando em postgres://${username}@${host}:${port}/${database} (synchronize=${synchronize})`,
        );

        return {
          type: 'postgres',
          host,
          port,
          username,
          password: configService.get<string>('POSTGRES_PASSWORD'),
          database,
          entities: [`${__dirname}/**/*.entity{.ts,.js}`],
          migrations: [`${__dirname}/migrations/*{.ts,.js}`],
          synchronize,
        };
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 20 },
        { name: 'medium', ttl: 10000, limit: 100 },
        { name: 'long', ttl: 60000, limit: 300 },
      ],
    }),
    WorksModule,
    SeriesModule,
    FranchisesModule,
    AuthorsModule,
    IllustratorsModule,
    UsersModule,
    OptionsModule,
    StatusModule,
    MediasModule,
    LanguagesModule,
    DashboardModule,
    SearchModule,
    AuthModule,
    CacheModule,
    RedisModule,
    FileModule,
    AppMiddlewareModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      inject: [Reflector],
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector, {
          excludeExtraneousValues: true,
        }),
    },
  ],
})
export class AppModule {}
