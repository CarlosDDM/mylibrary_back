import {
  Exclude,
  Expose,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer';
import { ResponseAuthorDto } from 'src/authors/dto/response-author.dto';
import { ResponseIllustratorDto } from 'src/illustrators/dto/response-illustrator.dto';
import { OptionsType } from 'src/options/dto/response-option.dto';
import { ResponseSeriesDto } from 'src/series/dto/response-series.dto';

export class ResponseWorkAuthorDto {
  @Expose()
  @Type(() => ResponseAuthorDto)
  author: ResponseAuthorDto;
}

export class ResponseWorkIllustratorDto {
  @Expose()
  @Type(() => ResponseIllustratorDto)
  illustrator: ResponseIllustratorDto;
}

type WorkAuthorRaw = {
  author: ResponseWorkAuthorDto;
};

type WorkIllustratorRaw = {
  illustrator: ResponseWorkIllustratorDto;
};

@Exclude()
export class ResponseWorkDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  subtitle: string | null;

  @Expose()
  volume: number | null;

  @Expose()
  @Transform(({ value }: { value: string }) => Number(value))
  price: number | null;

  @Expose()
  isSpecialEdition: boolean;

  @Expose()
  @Type(() => OptionsType)
  language: OptionsType | null;

  @Expose()
  @Type(() => OptionsType)
  media: OptionsType | null;

  @Expose({ name: 'authors' })
  @Transform(
    ({ value }: { value: WorkAuthorRaw[] | null }) =>
      value?.map((item) =>
        plainToInstance(ResponseAuthorDto, item.author, {
          excludeExtraneousValues: true,
        }),
      ) ?? [],
  )
  workAuthors: ResponseWorkAuthorDto[] | null;

  @Expose({ name: 'illustrators' })
  @Transform(
    ({ value }: { value: WorkIllustratorRaw[] | null }) =>
      value?.map((item) =>
        plainToInstance(ResponseIllustratorDto, item.illustrator, {
          excludeExtraneousValues: true,
        }),
      ) ?? [],
  )
  workIllustrators: ResponseWorkIllustratorDto[] | null;

  @Expose()
  @Transform(({ value }: { value: ResponseSeriesDto | null }) =>
    value
      ? plainToInstance(ResponseSeriesDto, value, {
          excludeExtraneousValues: true,
        })
      : null,
  )
  serie: ResponseSeriesDto | null;
  constructor(partial: unknown) {
    Object.assign(this, partial);
  }
}
