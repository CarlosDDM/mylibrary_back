import { ResponsePaginated } from 'src/common/dto/response-paginated.dto';
import { ResponseAuthorDto } from './response-author.dto';

export class PaginatedAuthorResponse extends ResponsePaginated(
  ResponseAuthorDto,
) {}
