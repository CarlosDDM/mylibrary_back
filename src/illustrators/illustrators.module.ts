import { Module } from '@nestjs/common';
import { IllustratorsService } from './illustrators.service';
import { IllustratorsController } from './illustrators.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Illustrator } from './entities/illustrator.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Illustrator])],
  controllers: [IllustratorsController],
  providers: [IllustratorsService],
})
export class IllustratorsModule {}
