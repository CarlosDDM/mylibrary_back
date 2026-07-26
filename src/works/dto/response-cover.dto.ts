import { Expose } from 'class-transformer';

export class ResponseCoverDto {
  @Expose() id: string;
  @Expose() url: string;
  @Expose() isSpecialEdition: boolean;
  @Expose() order: number;
}
