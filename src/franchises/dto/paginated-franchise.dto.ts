import { ResponsePaginated } from 'src/common/dto/response-paginated.dto';
import { ResponseFranchiseDto } from './response-franchise.dto';

export class PaginatedFranchiseResponse extends ResponsePaginated(
  ResponseFranchiseDto,
) {}
