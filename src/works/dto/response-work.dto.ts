import { Expose, Type } from 'class-transformer';
import { OptionsType } from 'src/options/dto/response-option.dto';
import { ResponseSeriesDto } from 'src/series/dto/response-series.dto';

export class ResponseWorkDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  subtitle: string;

  @Expose()
  volume: number;

  @Expose()
  price: number;

  @Expose()
  isSpecialEdition: boolean;

  @Expose()
  @Type(() => ResponseSeriesDto)
  serie: ResponseSeriesDto;

  @Expose()
  @Type(() => OptionsType)
  language: OptionsType;

  @Expose()
  @Type(() => OptionsType)
  media: OptionsType;
}
