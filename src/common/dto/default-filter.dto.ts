import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './base.dto';
import { Transform } from 'class-transformer';

export class DefaultFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  name?: string;
}
