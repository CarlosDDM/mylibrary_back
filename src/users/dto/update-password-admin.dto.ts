import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class UpdatePasswordAdminDto {
  @IsString()
  @IsNotEmpty({ message: 'A nova senha não pode ser vazia' })
  @IsStrongPassword(
    {},
    {
      message:
        'A senha precisa ter ao menos 8 caracteres, com maiúscula, minúscula, número e símbolo',
    },
  )
  @MaxLength(100, { message: 'A senha não pode ter mais de 100 caracteres' })
  newPassword: string;
}
