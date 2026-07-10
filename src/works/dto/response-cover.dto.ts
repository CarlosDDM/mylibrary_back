import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseCoverDto {
  @Expose() id: string;
  @Expose() url: string;
  @Expose() isSpecialEdition: boolean;
  @Expose() order: number;
}
