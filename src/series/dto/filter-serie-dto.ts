import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/base.dto';
import { toArray } from 'src/common/utils/to-array.utils';

export class FilterSerieDto extends PaginationDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(toArray)
  franchiseIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(toArray)
  statusIds?: string[];
}
