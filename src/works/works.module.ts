import { Module } from '@nestjs/common';
import { WorksService } from './works.service';
import { WorksController } from './works.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Work } from './entities/work.entity';
import { WorkIllustrator } from './entities/work-illustrator.entity';
import { WorkAuthor } from './entities/work-author.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Work, WorkAuthor, WorkIllustrator])],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
