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
import { FileService } from './file/file.service';
import { FileModule } from './file/file.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { envValidationSchema } from './config/env.validation';

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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [`${__dirname}/**/*.entity{.ts,.js}`],
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
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
  ],
  providers: [
    FileService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
