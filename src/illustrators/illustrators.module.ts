import { Module } from '@nestjs/common';
import { IllustratorsService } from './illustrators.service';
import { IllustratorsController } from './illustrators.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Illustrator } from './entities/illustrator.entity';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Illustrator]), CacheModule],
  controllers: [IllustratorsController],
  providers: [IllustratorsService],
  exports: [IllustratorsService],
})
export class IllustratorsModule {}
