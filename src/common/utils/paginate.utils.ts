import { PaginationDto } from '../dto/base.dto';

export function paginate<T>(
  [data, total]: [T[], number],
  { take = 30, skip = 0 }: PaginationDto,
) {
  return {
    data,
    pages: Math.ceil(total / take),
    current_page: Math.floor(skip / take) + 1,
    total,
  };
}
