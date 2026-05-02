import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseAuthorDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}
