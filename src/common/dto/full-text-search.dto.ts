import type { FindOptionsRelations } from 'typeorm';
import { PaginationDto } from './base.dto';

export interface FullTextSearchOptions<T> extends PaginationDto {
  /** Propriedades da entity, não colunas do banco — o TypeORM traduz. */
  columns: string[];
  term?: string | null;
  relations?: FindOptionsRelations<T>;
}
