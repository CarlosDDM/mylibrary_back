import { IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @IsString()
  @IsNotEmpty({ message: 'O username não pode ser vazio' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha não pode ser vazia' })
  password: string;
}
