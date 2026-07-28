import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  SerializeOptions,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { PaginatedAuthorResponse } from './dto/pagination-author.dto';
import { ResponseAuthorDto } from './dto/response-author.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiAdminOnly,
  ApiConflict,
  ApiFindById,
  ApiInvalidBody,
  ApiThrottled,
  ApiUnauthorized,
} from 'src/common/decorators/api-errors.decorator';

@ApiTags('authors')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('authors')
@SerializeOptions({ type: ResponseAuthorDto })
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  /** Cadastra um autor */
  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: ResponseAuthorDto })
  @ApiInvalidBody()
  @ApiConflict('Author já existe')
  @ApiAdminOnly()
  create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  /** Lista autores paginados, com filtro por nome */
  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedAuthorResponse })
  @ApiOkResponse({ type: PaginatedAuthorResponse })
  findAll(@Query() paginationDto: DefaultFilterDto) {
    return this.authorsService.findAllByName(paginationDto);
  }

  /** Busca um autor por id */
  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: ResponseAuthorDto })
  @ApiFindById('Author')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.authorsService.findOneByCache(id);
  }

  /** Atualiza parcialmente um autor */
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseAuthorDto })
  @ApiFindById('Author')
  @ApiInvalidBody()
  @ApiConflict('Author já existe')
  @ApiAdminOnly()
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  /** Remove um autor e devolve o registro apagado */
  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseAuthorDto })
  @ApiFindById('Author')
  @ApiAdminOnly()
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.authorsService.delete({ id });
  }
}
