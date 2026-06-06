import { Exclude, Expose, Type } from 'class-transformer';
import { ResponseSeriesDto } from 'src/series/dto/response-series.dto';

@Exclude()
export class ResponseFranchiseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Type(() => ResponseSeriesDto)
  series: ResponseSeriesDto[];

  constructor(partial: unknown) {
    Object.assign(this, partial);
  }
}
