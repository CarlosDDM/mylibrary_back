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
import { FranchisesService } from './franchises.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import { PaginatedFranchiseResponse } from './dto/paginated-franchise.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';
import { ResponseFranchiseDto } from './dto/response-franchise.dto';
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

@ApiTags('franchises')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('franchises')
@SerializeOptions({ type: ResponseFranchiseDto })
export class FranchisesController {
  constructor(private readonly franchisesService: FranchisesService) {}

  /** Cadastra uma franquia */
  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: ResponseFranchiseDto })
  @ApiInvalidBody()
  @ApiConflict('Franchise já existe')
  @ApiAdminOnly()
  create(@Body() createFranchiseDto: CreateFranchiseDto) {
    return this.franchisesService.create(createFranchiseDto);
  }

  /** Lista franquias paginadas, com filtro por nome */
  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedFranchiseResponse })
  @ApiOkResponse({ type: PaginatedFranchiseResponse })
  findAll(@Query() paginationDto: DefaultFilterDto) {
    return this.franchisesService.findAllByName(paginationDto);
  }

  /** Busca uma franquia por id, com as séries dela */
  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: ResponseFranchiseDto })
  @ApiFindById('Franchise')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.franchisesService.findOneByCache(id);
  }

  /** Atualiza parcialmente uma franquia */
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseFranchiseDto })
  @ApiFindById('Franchise')
  @ApiInvalidBody()
  @ApiConflict('Franchise já existe')
  @ApiAdminOnly()
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateFranchiseDto: UpdateFranchiseDto,
  ) {
    return this.franchisesService.update(id, updateFranchiseDto);
  }

  /** Remove uma franquia e devolve o registro apagado */
  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseFranchiseDto })
  @ApiFindById('Franchise')
  @ApiAdminOnly()
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.franchisesService.delete({ id });
  }
}
