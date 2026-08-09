import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  SerializeOptions,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IllustratorsService } from './illustrators.service';
import { CreateIllustratorDto } from './dto/create-illustrator.dto';
import { UpdateIllustratorDto } from './dto/update-illustrator.dto';
import { ResponseIllustratorDto } from './dto/response-illustrator.dto';
import { PaginatedIllustratorResponse } from './dto/paginated-illustrator.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
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

@ApiTags('illustrators')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('illustrators')
@SerializeOptions({ type: ResponseIllustratorDto })
export class IllustratorsController {
  constructor(private readonly illustratorsService: IllustratorsService) {}

  /** Cadastra um ilustrador */
  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: ResponseIllustratorDto })
  @ApiInvalidBody()
  @ApiConflict('Illustrator já existe')
  @ApiAdminOnly()
  create(@Body() createIllustratorDto: CreateIllustratorDto) {
    return this.illustratorsService.create(createIllustratorDto);
  }

  /** Lista ilustradores paginados. O filtro `name` é full text: casa prefixo de palavra e ignora acento */
  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedIllustratorResponse })
  @ApiOkResponse({ type: PaginatedIllustratorResponse })
  findAll(@Query() paginationDto: DefaultFilterDto) {
    return this.illustratorsService.findAllByName(paginationDto);
  }

  /** Busca um ilustrador por id */
  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: ResponseIllustratorDto })
  @ApiFindById('Illustrator')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.illustratorsService.findOneByCache(id);
  }

  /** Atualiza parcialmente um ilustrador */
  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @ApiOkResponse({ type: ResponseIllustratorDto })
  @ApiFindById('Illustrator')
  @ApiInvalidBody()
  @ApiConflict('Illustrator já existe')
  @ApiAdminOnly()
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIllustratorDto: UpdateIllustratorDto,
  ) {
    return this.illustratorsService.update(id, updateIllustratorDto);
  }

  /** Remove um ilustrador e devolve o registro apagado */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @ApiOkResponse({ type: ResponseIllustratorDto })
  @ApiFindById('Illustrator')
  @ApiAdminOnly()
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.illustratorsService.delete({ id });
  }
}
