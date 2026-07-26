import { Expose, Type } from 'class-transformer';
import { ResponseSeriesDto } from 'src/series/dto/response-series.dto';

export class ResponseFranchiseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Type(() => ResponseSeriesDto)
  series: ResponseSeriesDto[];
}
