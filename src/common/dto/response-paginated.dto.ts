import { Type } from '@nestjs/common';
import { Expose, Type as TransformationType } from 'class-transformer';
import { PaginationDto } from './base.dto';

export interface IPaginated<T> {
  data: T[];
  total: number;
  current_page: number;
  pages: number;
}

export function ResponsePaginated<T>(classRef: Type<T>): Type<IPaginated<T>> {
  class PaginatedHost implements IPaginated<T> {
    @Expose()
    @TransformationType(() => classRef)
    data: T[];

    @Expose() total: number;
    @Expose() pages: number;
    @Expose() current_page: number;
  }

  return PaginatedHost;
}

export function paginate<T>(
  [data, total]: [T[], number],
  { take = 20, skip = 0 }: PaginationDto,
) {
  return {
    data,
    pages: Math.ceil(total / take),
    current_page: Math.floor(skip / take) + 1,
    total,
  };
}
