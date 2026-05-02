import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class OptionsType {
  @Expose()
  id: string;

  @Expose()
  type: string;
}

export class ResponseOption {
  @Expose()
  @Type(() => OptionsType)
  status: OptionsType[];

  @Expose()
  @Type(() => OptionsType)
  medias: OptionsType[];

  @Expose()
  @Type(() => OptionsType)
  languages: OptionsType[];
}
