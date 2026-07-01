import { Role } from 'src/common/enums/role.enum';

declare global {
  namespace Express {
    // augments req.user with the session payload
    interface User {
      userId: string;
      role: Role;
    }
  }
}

export {};
