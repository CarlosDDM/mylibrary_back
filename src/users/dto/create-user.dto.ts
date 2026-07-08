import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(4, { message: 'O nome tem que ter mais de 4 caracteres' })
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: 'O username tem que ter mais de 4 caracteres' })
  @MaxLength(100)
  username: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha não pode ser vazia' })
  @IsStrongPassword(
    {},
    {
      message:
        'A senha precisa ter ao menos 8 caracteres, com maiúscula, minúscula, número e símbolo',
    },
  )
  @MaxLength(100, { message: 'A senha não pode ter mais de 100 caracteres' })
  password: string;
}
