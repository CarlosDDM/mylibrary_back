import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { WorksModule } from 'src/works/works.module';
import { SeriesModule } from 'src/series/series.module';

@Module({
  controllers: [SearchController],
  providers: [SearchService],
  imports: [WorksModule, SeriesModule],
})
export class SearchModule {}
