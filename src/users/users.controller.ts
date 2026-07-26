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
import { PaginatedUserResponse } from './dto/paginated-user.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { SelfOrAdminGuard } from 'src/auth/guards/self-or-admin.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';
import { UpdatePasswordAdminDto } from './dto/update-password-admin.dto';
import { ResponseUserRoleDto } from './dto/response-user-role.dto';

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
  @SerializeOptions({ type: PaginatedUserResponse })
  findAll(@Query() paginationDto: DefaultFilterDto) {
    return this.usersService.findAllByName(paginationDto);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard, SelfOrAdminGuard)
  @SerializeOptions({ type: ResponseUserRoleDto })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.findOne({ id });
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard, SelfOrAdminGuard)
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
  @UseGuards(AuthenticatedGuard, SelfOrAdminGuard)
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
    return this.usersService.updatePasswordAdmin(id, updatePassAdminDto);
  }

  @Post(':id/promote')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: ResponseUserRoleDto })
  promoteRole(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.promoteRole(id);
  }

  @Post(':id/demote')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: ResponseUserRoleDto })
  demoteRole(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.demoteRole(id);
  }
}
