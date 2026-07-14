import { Module } from '@nestjs/common';
import { FranchisesService } from './franchises.service';
import { FranchisesController } from './franchises.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Franchise } from './entities/franchise.entity';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Franchise]), CacheModule],
  controllers: [FranchisesController],
  providers: [FranchisesService],
  exports: [FranchisesService],
})
export class FranchisesModule {}
