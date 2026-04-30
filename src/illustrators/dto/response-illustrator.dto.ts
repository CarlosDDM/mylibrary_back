import { Expose } from 'class-transformer';

export class ResponseIllustratorDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}
