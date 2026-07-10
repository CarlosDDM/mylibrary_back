import { Injectable } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto';
import { WorksService } from 'src/works/works.service';
import { SeriesService } from 'src/series/series.service';
import { ILike } from 'typeorm';
@Injectable()
export class SearchService {
  constructor(
    private readonly workService: WorksService,
    private readonly serieService: SeriesService,
  ) {}

  async findAll({ name, take, skip }: SearchQueryDto) {
    const [[worksData, worksTotal], [seriesData, seriesTotal]] =
      await Promise.all([
        this.workService.search(
          { take, skip },
          { name: ILike(`%${name}%`) },
          { covers: true },
        ),
        this.serieService.search({ take, skip }, { name: ILike(`%${name}%`) }),
      ]);

    return {
      works: { data: worksData, total: worksTotal },
      series: { data: seriesData, total: seriesTotal },
    };
  }
}
