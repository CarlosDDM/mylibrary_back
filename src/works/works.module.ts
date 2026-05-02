import { Module } from '@nestjs/common';
import { WorksService } from './works.service';
import { WorksController } from './works.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Work } from './entities/work.entity';
import { WorkIllustrator } from './entities/work-illustrator.entity';
import { WorkAuthor } from './entities/work-author.entity';
import { SeriesModule } from 'src/series/series.module';
import { MediasModule } from 'src/medias/medias.module';
import { LanguagesModule } from 'src/languages/languages.module';
import { AuthorsModule } from 'src/authors/authors.module';
import { IllustratorsModule } from 'src/illustrators/illustrators.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Work, WorkAuthor, WorkIllustrator]),
    SeriesModule,
    MediasModule,
    LanguagesModule,
    AuthorsModule,
    IllustratorsModule,
  ],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
