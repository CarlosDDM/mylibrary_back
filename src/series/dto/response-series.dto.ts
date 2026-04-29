import { Expose, Type } from 'class-transformer';
import { OptionsType } from 'src/options/dto/response-option.dto';
import { Work } from 'src/works/entities/work.entity';

export class ResponseSeriesDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  serieVolumes: number | null;

  @Expose()
  @Type(() => OptionsType)
  status: OptionsType;

  @Expose()
  @Type(() => Work)
  works: Work[];

  @Expose()
  @Type(() => ResponseSeriesDto)
  franchise: ResponseSeriesDto | null;
}
