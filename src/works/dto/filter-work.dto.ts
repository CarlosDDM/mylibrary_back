import { IsOptional, IsArray, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/base.dto';

const toArray = ({ value }) =>
  value == null ? value : Array.isArray(value) ? value : [value];

export class FilterWorkDto extends PaginationDto {
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
