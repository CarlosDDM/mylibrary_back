import { Role } from 'src/common/enums/role.enum';

export interface SessionUser {
  userId: string;
  role: Role;
}
