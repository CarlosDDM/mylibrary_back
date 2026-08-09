import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/dto/base.dto';

export class SearchQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'A busca não pode ter mais de 200 caracteres' })
  name?: string;
}
