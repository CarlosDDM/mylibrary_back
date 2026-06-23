import { Type } from '@nestjs/common';
import { Expose, Type as TransformationType } from 'class-transformer';

interface ISearchDto<T> {
  data: T[];
  total: number;
}

function responseSearch<T>(classRef: Type<T>): Type<ISearchDto<T>> {
  class SearchHost implements ISearchDto<T> {
    @Expose()
    @TransformationType(() => classRef)
    data: T[];

    @Expose()
    total: number;
  }
  return SearchHost;
}

class WorkSearchDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() subtitle: string;
  @Expose() volume: number;
}

class SerieSearchDto {
  @Expose() id: string;
  @Expose() name: string;
}

class WorksPaginated extends responseSearch(WorkSearchDto) {}
class SeriesPaginated extends responseSearch(SerieSearchDto) {}

export class ResponseSearchDto {
  @Expose()
  @TransformationType(() => WorksPaginated)
  works: WorksPaginated;

  @Expose()
  @TransformationType(() => SeriesPaginated)
  series: SeriesPaginated;
}
