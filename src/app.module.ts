import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksModule } from './works/works.module';
import { SeriesModule } from './series/series.module';
import { FranchisesModule } from './franchises/franchises.module';
import { AuthorsModule } from './authors/authors.module';
import { IllustratorsModule } from './illustrators/illustrators.module';
import { LanguagesModule } from './languages/languages.module';
import { UsersModule } from './users/users.module';

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
        synchronize: true, //TODO desabilitar em produção
      }),
    }),
    WorksModule,
    SeriesModule,
    FranchisesModule,
    AuthorsModule,
    IllustratorsModule,
    LanguagesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
