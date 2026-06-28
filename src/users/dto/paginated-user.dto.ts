import { ResponsePaginated } from 'src/common/dto/response-paginated.dto';
import { ResponseUserDto } from './response-user.dto';

export class PaginatedUserDto extends ResponsePaginated(ResponseUserDto) {}
