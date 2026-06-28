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

type WorkRaw = {
  workAuthors?: { author: { id: string; name: string } }[];
  workIllustrators?: { illustrator: { id: string; name: string } }[];
};

@Exclude()
export class ResponseWorkDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() subtitle: string | null;
  @Expose() volume: number | null;
  @Expose() volumeName: string | null;

  @Expose()
  @Transform(({ value }: { value: string | null }) =>
    value == null ? null : Number(value),
  )
  price: number | null;

  @Expose() isSpecialEdition: boolean;

  @Expose() @Type(() => OptionsType) language: OptionsType | null;
  @Expose() @Type(() => OptionsType) media: OptionsType | null;

  @Expose()
  @Transform(
    ({ obj }: { obj: WorkRaw }) =>
      obj.workAuthors?.map((item) =>
        plainToInstance(ResponseAuthorDto, item.author, {
          excludeExtraneousValues: true,
        }),
      ) ?? [],
    { toClassOnly: true },
  )
  authors: ResponseAuthorDto[];

  @Expose()
  @Transform(
    ({ obj }: { obj: WorkRaw }) =>
      obj.workIllustrators?.map((item) =>
        plainToInstance(ResponseIllustratorDto, item.illustrator, {
          excludeExtraneousValues: true,
        }),
      ) ?? [],
    { toClassOnly: true },
  )
  illustrators: ResponseIllustratorDto[];

  @Expose()
  @Type(() => ResponseSeriesDto)
  serie: ResponseSeriesDto | null;
}
