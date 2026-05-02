import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateWorkDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  subtitle: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  volume: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price: number | null;

  @IsUUID()
  @IsNotEmpty()
  mediaId: string;

  @IsUUID()
  @IsNotEmpty()
  languageId: string;

  @IsUUID()
  @IsOptional()
  serieId: string;

  @IsBoolean()
  @IsOptional()
  isSpecialEdition: boolean;

  @Transform(({ value }: { value: string[] }) => [...new Set(value)])
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  authors: string[] = [];

  @Transform(({ value }: { value: string[] }) => [...new Set(value)])
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  illustrators: string[] = [];
}
