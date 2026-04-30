import { IsNotEmpty, IsString } from 'class-validator';

export class CreateIllustratorDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
