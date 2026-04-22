import { Module } from '@nestjs/common';
import { FranchisesService } from './franchises.service';
import { FranchisesController } from './franchises.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Franchise } from './entities/franchise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Franchise])],
  controllers: [FranchisesController],
  providers: [FranchisesService],
})
export class FranchisesModule {}
