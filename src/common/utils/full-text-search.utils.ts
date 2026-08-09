import type { ObjectLiteral, Repository } from 'typeorm';
import { FullTextSearchOptions } from '../dto/full-text-search.dto';

const SEARCH_CONFIG = 'public.simple_unaccent';

function tsVector(alias: string, columns: string[]) {
  const fields = columns
    .map((column) => `coalesce(${alias}.${column}, '')`)
    .join(` || ' ' || `);

  return `to_tsvector('${SEARCH_CONFIG}', ${fields})`;
}

function tsQuery(parameter: string) {
  const lexemes = `tsvector_to_array(to_tsvector('${SEARCH_CONFIG}', ${parameter}))`;

  return `to_tsquery('${SEARCH_CONFIG}', nullif(array_to_string(${lexemes}, ':* & '), '') || ':*')`;
}

export async function searchByFullText<T extends ObjectLiteral>(
  repository: Repository<T>,
  { columns, term, take = 10, skip = 0, relations }: FullTextSearchOptions<T>,
): Promise<[T[], number]> {
  if (!term?.trim()) return [[], 0];

  const qb = repository
    .createQueryBuilder('entity')
    .where(`${tsVector('entity', columns)} @@ ${tsQuery(':term')}`, { term })
    .take(take)
    .skip(skip);

  if (relations) {
    qb.setFindOptions({ relations, relationLoadStrategy: 'query' });
  }

  return qb.getManyAndCount();
}
