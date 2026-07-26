import { Expose, Type } from 'class-transformer';
import { ResponseFranchiseDto } from 'src/franchises/dto/response-franchise.dto';
import { OptionsType } from 'src/options/dto/response-option.dto';
import { ResponseWorkDto } from 'src/works/dto/response-work.dto';

export class ResponseSeriesDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  serieVolumes: number | null;

  @Expose()
  coverUrl: string | null;

  @Expose()
  @Type(() => OptionsType)
  status: OptionsType;

  @Expose()
  @Type(() => ResponseWorkDto)
  works: ResponseWorkDto[];

  @Expose()
  worksCount: number;

  @Expose()
  @Type(() => ResponseFranchiseDto)
  franchise: ResponseFranchiseDto | null;
}
