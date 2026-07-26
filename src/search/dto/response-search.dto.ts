import { Type } from '@nestjs/common';
import { Expose, Type as TransformationType } from 'class-transformer';
import { ResponseCoverDto } from 'src/works/dto/response-cover.dto';

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
  @Expose()
  @TransformationType(() => ResponseCoverDto)
  covers: ResponseCoverDto[];
}

class SerieSearchDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() coverUrl: string | null;
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
