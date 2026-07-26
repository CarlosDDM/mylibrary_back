import { ResponsePaginated } from 'src/common/dto/response-paginated.dto';
import { ResponseUserRoleDto } from './response-user-role.dto';

export class PaginatedUserResponse extends ResponsePaginated(
  ResponseUserRoleDto,
) {}
