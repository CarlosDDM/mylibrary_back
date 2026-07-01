import 'express-session';
import { Role } from 'src/common/enums/role.enum';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: Role;
  }
}
