import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from 'src/users/entities/user.entity';
import { SessionUser } from '../types/session-user';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(
    user: User,
    done: (err: Error | null, payload: SessionUser) => void,
  ) {
    done(null, { userId: user.id, role: user.role });
  }

  deserializeUser(
    payload: SessionUser,
    done: (err: Error | null, payload: SessionUser) => void,
  ) {
    done(null, payload);
  }
}
