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
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiAdminOnly,
  ApiConflict,
  ApiFindById,
  ApiInvalidBody,
  ApiSelfOrAdmin,
  ApiThrottled,
  ApiUnauthorized,
} from 'src/common/decorators/api-errors.decorator';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';

@ApiTags('users')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('users')
@SerializeOptions({ type: ResponseUserDto })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Cadastra um usuário */
  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: ResponseUserDto })
  @ApiInvalidBody()
  @ApiConflict('Users já existe')
  @ApiAdminOnly()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /** Lista usuários paginados. O filtro `name` é full text: casa prefixo de palavra e ignora acento */
  @Get()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @SerializeOptions({ type: PaginatedUserResponse })
  @ApiOkResponse({ type: PaginatedUserResponse })
  @ApiAdminOnly()
  findAll(@Query() paginationDto: DefaultFilterDto) {
    return this.usersService.findAllByName(paginationDto);
  }

  /** Busca um usuário por id, incluindo o papel */
  @Get(':id')
  @UseGuards(AuthenticatedGuard, SelfOrAdminGuard)
  @SerializeOptions({ type: ResponseUserRoleDto })
  @ApiOkResponse({ type: ResponseUserRoleDto })
  @ApiFindById('Users')
  @ApiSelfOrAdmin()
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.findOne({ id });
  }

  /** Atualiza nome e email do usuário */
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, SelfOrAdminGuard)
  @ApiOkResponse({ type: ResponseUserDto })
  @ApiFindById('Users')
  @ApiInvalidBody()
  @ApiConflict('Users já existe')
  @ApiSelfOrAdmin()
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  /** Remove um usuário e devolve o registro apagado */
  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseUserDto })
  @ApiFindById('Users')
  @ApiAdminOnly()
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.delete({ id });
  }

  /** Troca a senha conferindo a atual */
  @Patch(':id/password')
  @UseGuards(AuthenticatedGuard, SelfOrAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Senha trocada' })
  @ApiFindById('Users')
  @ApiInvalidBody()
  @ApiForbiddenResponse({
    description: 'A senha atual está incorreta, ou o id não é o seu',
    type: ErrorResponseDto,
  })
  updatePassword(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  /** Redefine a senha de um usuário sem pedir a atual */
  @Patch(':id/password/admin')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Senha redefinida sem pedir a atual' })
  @ApiFindById('Users')
  @ApiInvalidBody()
  @ApiAdminOnly()
  updatePasswordAdmin(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updatePassAdminDto: UpdatePasswordAdminDto,
  ) {
    return this.usersService.updatePasswordAdmin(id, updatePassAdminDto);
  }

  /** Promove o usuário a ADMIN */
  @Post(':id/promote')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: ResponseUserRoleDto })
  @ApiOkResponse({ type: ResponseUserRoleDto })
  @ApiFindById('Users')
  @ApiInvalidBody()
  @ApiAdminOnly()
  promoteRole(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.promoteRole(id);
  }

  /** Rebaixa o usuário a USER */
  @Post(':id/demote')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: ResponseUserRoleDto })
  @ApiOkResponse({ type: ResponseUserRoleDto })
  @ApiFindById('Users')
  @ApiInvalidBody()
  @ApiAdminOnly()
  demoteRole(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.demoteRole(id);
  }
}
