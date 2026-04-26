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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
        //TODO habilitar as migration migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
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
  ],
})
export class AppModule {}
