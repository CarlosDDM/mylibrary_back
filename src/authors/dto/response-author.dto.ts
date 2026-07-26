import { Expose } from 'class-transformer';

export class ResponseAuthorDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}
