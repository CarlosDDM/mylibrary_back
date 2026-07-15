import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingService } from 'src/common/hashing/hashing.service';
import { BaseService } from 'src/common/base.service';
import { User } from './entities/user.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdatePasswordAdminDto } from './dto/update-password-admin.dto';
import { Role } from 'src/common/enums/role.enum';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly sessionService: SessionService,
  ) {
    super(userRepository, 'Users');
  }
  private async validateUser(dto: CreateUserDto) {
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

  async delete(where: FindOptionsWhere<User>) {
    const result = await super.delete(where);
    await this.sessionService.destroyUserSessions(result.id);
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne({ id });

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
      throw new ForbiddenException('A senha atual está incorreta');
    }

    const passwordsMatch =
      updatePasswordDto.newPassword === updatePasswordDto.confirmPassword;

    if (!passwordsMatch) {
      throw new BadRequestException(
        'A nova senha e a confirmação não conferem',
      );
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
    await this.sessionService.destroyUserSessions(id);
  }

  async uptadePasswordAdmin(
    id: string,
    { newPassword }: UpdatePasswordAdminDto,
  ) {
    await this.validateExists({ id });
    const hashedPassword = await this.hashingService.hash(newPassword);

    await this.repository.update({ id }, { hashedPassword });
    await this.sessionService.destroyUserSessions(id);
  }

  async promoteRole(id: string) {
    const user = await this.findOne({ id });

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('O usuário já é um administrador');
    }

    await this.repository.update({ id }, { role: Role.ADMIN });
    await this.sessionService.destroyUserSessions(id);

    return this.findOne({ id });
  }

  private async canBeDemoted(id: string) {
    const user = await this.findOne({ id });

    if (user.role !== Role.ADMIN) {
      throw new BadRequestException(`O ${user.username} já é um usuário`);
    }

    const totalAdmin = await this.repository.countBy({ role: Role.ADMIN });
    if (totalAdmin <= 1) {
      throw new BadRequestException('Deve existir pelo menos 1 administrador');
    }
  }

  async demoteRole(id: string) {
    await this.canBeDemoted(id);

    await this.repository.update({ id }, { role: Role.USER });
    await this.sessionService.destroyUserSessions(id);

    return this.findOne({ id });
  }

  findOneOrNull(username: string) {
    return this.repository.findOneBy({ username });
  }
}
