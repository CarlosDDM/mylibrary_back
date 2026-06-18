import { ResponsePaginated } from 'src/common/dto/response-paginated.dto';
import { ResponseSeriesDto } from './response-series.dto';

export class PaginatedSeriesResponse extends ResponsePaginated(
  ResponseSeriesDto,
) {}
