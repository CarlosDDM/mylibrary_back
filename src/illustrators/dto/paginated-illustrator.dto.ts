import { ResponsePaginated } from 'src/common/dto/response-paginated.dto';
import { ResponseIllustratorDto } from './response-illustrator.dto';

export class PaginatedIllustratorResponse extends ResponsePaginated(
  ResponseIllustratorDto,
) {}
