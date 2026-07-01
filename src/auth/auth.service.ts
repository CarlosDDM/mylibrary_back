import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import { HashingService } from 'src/common/hashing/hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly hashService: HashingService,
  ) {}

  async login(authDto: AuthDto) {
    const user = await this.userService.findOneOrNull(authDto.username);

    if (
      !user ||
      !(await this.hashService.compare(authDto.password, user.hashedPassword))
    ) {
      throw new UnauthorizedException('Senha ou usuário errados');
    }

    return user;
  }
}
