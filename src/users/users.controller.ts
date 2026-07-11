import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  SerializeOptions,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginatedUserDto } from './dto/paginated-user.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';
import { UpdatePasswordAdminDto } from './dto/update-password-admin.dto';
import { ILike } from 'typeorm';

@Controller('users')
@SerializeOptions({ type: ResponseUserDto })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @SerializeOptions({ type: PaginatedUserDto })
  async findAll(@Query() paginationDto: DefaultFilterDto) {
    const where = paginationDto.name
      ? { name: ILike(`%${paginationDto.name}%`) }
      : undefined;

    const [users, total] = await this.usersService.findAll(
      paginationDto,
      where,
    );

    return paginate([users, total], paginationDto);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.findOne({ id });
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.delete({ id });
  }

  @Patch(':id/password')
  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  updatePassword(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Patch(':id/password/admin')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  updatePasswordAdmin(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updatePassAdminDto: UpdatePasswordAdminDto,
  ) {
    return this.usersService.uptadePasswordAdmin(id, updatePassAdminDto);
  }
}
