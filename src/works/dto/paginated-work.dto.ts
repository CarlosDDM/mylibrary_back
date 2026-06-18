import { ResponsePaginated } from 'src/common/dto/response-paginated.dto';
import { ResponseWorkDto } from './response-work.dto';

export class PaginatedWorkResponse extends ResponsePaginated(ResponseWorkDto) {}
