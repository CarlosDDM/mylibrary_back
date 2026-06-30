import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { LocalStrategy } from './strategys/local.strategy';
import { SessionSerializer } from './strategys/session.serializer';

@Module({
  imports: [
    UsersModule,
    CommonModule,
    PassportModule.register({ session: true }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionSerializer],
})
export class AuthModule {}
