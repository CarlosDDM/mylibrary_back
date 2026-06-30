import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingService } from 'src/common/hashing/hashing.service';
import { BaseService } from 'src/common/base.service';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {
    super(userRepository, 'Users');
  }
  private async validateUser(dto: CreateUserDto | UpdateUserDto) {
    if (dto.email) {
      await this.validateNotExists({
        email: dto.email,
      });
    }

    if (dto.username) {
      await this.validateNotExists({
        username: dto.username,
      });
    }
  }

  async create(createUserDto: CreateUserDto) {
    await this.validateUser(createUserDto);

    const { password, ...user } = createUserDto;
    const hashedPassword = await this.hashingService.hash(password);

    return this.repository.save({ ...user, hashedPassword });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne({ id });

    if (updateUserDto.username && user.username !== updateUserDto.username) {
      await this.validateNotExists({ username: updateUserDto.username });
    }

    if (updateUserDto.email && user.email !== updateUserDto.email) {
      await this.validateNotExists({ email: updateUserDto.email });
    }

    await this.repository.update({ id }, updateUserDto);
    return this.findOne({ id });
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.findOne({ id });

    const canBeChanged = await this.hashingService.compare(
      updatePasswordDto.currentPassword,
      user.hashedPassword,
    );

    if (!canBeChanged) {
      throw new UnauthorizedException('A senha atual está incorreta');
    }

    const sameAsOld = await this.hashingService.compare(
      updatePasswordDto.newPassword,
      user.hashedPassword,
    );

    if (sameAsOld) {
      throw new BadRequestException('A nova senha está igual à anterior');
    }

    const hashedPassword = await this.hashingService.hash(
      updatePasswordDto.newPassword,
    );

    await this.repository.update({ id }, { hashedPassword });
  }

  findOneOrNull(username: string) {
    return this.repository.findOneBy({ username });
  }
}
