import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number = 0;
}
