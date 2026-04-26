import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Serie } from './entities/serie.entity';
import { StatusModule } from 'src/status/status.module';
import { FranchisesModule } from 'src/franchises/franchises.module';

@Module({
  imports: [TypeOrmModule.forFeature([Serie]), StatusModule, FranchisesModule],
  controllers: [SeriesController],
  providers: [SeriesService],
})
export class SeriesModule {}
