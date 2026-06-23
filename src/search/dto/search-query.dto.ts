import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/base.dto';

export class SearchQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;
}
