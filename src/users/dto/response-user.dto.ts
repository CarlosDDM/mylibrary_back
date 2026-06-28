import { Expose } from 'class-transformer';

export class ResponseUserDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  username: string;

  @Expose()
  email: string;
}
