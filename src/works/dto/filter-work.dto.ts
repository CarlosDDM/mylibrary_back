import {
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/base.dto';
import { toArray } from 'src/common/utils/to-array.utils';

export class FilterWorkDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(toArray)
  mediaIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(toArray)
  languageIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(toArray)
  authorIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(toArray)
  illustratorIds?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  isSpecialEdition?: boolean;
}
