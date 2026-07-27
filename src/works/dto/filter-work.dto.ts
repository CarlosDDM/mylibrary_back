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
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    // Query vazia conta como filtro ausente, igual ao name do DefaultFilterDto.
    if (value === '' || value === undefined) return undefined;
    // Qualquer outra coisa segue crua para o @IsBoolean recusar com 400, em vez
    // de virar undefined e o filtro ser silenciosamente ignorado — é o mesmo
    // tratamento que mediaIds e os demais filtros já davam.
    return value;
  })
  isSpecialEdition?: boolean;
}
