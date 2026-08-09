import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { AddCoverDto } from './dto/add-cover.dto';
import { ValidateImagePipe } from 'src/file/pipe/validate-image.pipe';
import { ResponseWorkDto } from './dto/response-work.dto';
import { FilterWorkDto } from './dto/filter-work.dto';
import { PaginatedWorkResponse } from './dto/paginated-work.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/auth/guards/role.guard';
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
  ApiUuidParam,
} from 'src/common/decorators/api-errors.decorator';
import { ApiImageUpload } from 'src/common/decorators/api-image-upload.decorator';

@ApiTags('works')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('works')
@SerializeOptions({ type: ResponseWorkDto })
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  /** Cadastra uma obra */
  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: ResponseWorkDto })
  @ApiInvalidBody()
  @ApiConflict('Work já existe', 'Volume 3 já existe para essa serie')
  @ApiAdminOnly()
  async create(@Body() createWorkDto: CreateWorkDto) {
    const work = await this.worksService.create(createWorkDto);
    return work;
  }

  /** Lista obras paginadas, com filtro por mídia, idioma, autor, ilustrador e edição especial. O filtro `name` é full text: casa prefixo de palavra e ignora acento */
  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedWorkResponse })
  @ApiOkResponse({ type: PaginatedWorkResponse })
  findAll(@Query() filterDto: FilterWorkDto) {
    return this.worksService.findAll(filterDto);
  }

  /** Busca uma obra por id */
  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: ResponseWorkDto })
  @ApiFindById('Work')
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const work = await this.worksService.findOneById(id);
    return work;
  }

  /** Atualiza parcialmente uma obra */
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseWorkDto })
  @ApiFindById('Work')
  @ApiInvalidBody()
  @ApiConflict('Work já existe', 'Volume 3 já existe para essa serie')
  @ApiAdminOnly()
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateWorkDto: UpdateWorkDto,
  ) {
    const work = await this.worksService.update(id, updateWorkDto);
    return work;
  }

  /** Remove uma obra e devolve o registro apagado */
  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseWorkDto })
  @ApiFindById('Work')
  @ApiAdminOnly()
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const work = await this.worksService.delete({ id });
    return work;
  }

  /** Adiciona uma capa à obra, no fim da ordem */
  @Post(':id/covers')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiImageUpload({
    isSpecialEdition: {
      type: 'boolean',
      default: false,
      description: 'Marca a capa como de edição especial',
    },
  })
  @ApiCreatedResponse({ type: ResponseWorkDto })
  @ApiFindById('Work')
  @ApiAdminOnly()
  addCover(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile(ValidateImagePipe) file: Express.Multer.File,
    @Body() addCoverDto: AddCoverDto,
  ) {
    return this.worksService.addCover(id, file, addCoverDto.isSpecialEdition);
  }

  /** Remove uma capa da obra */
  @Delete(':id/covers/:coverId')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseWorkDto })
  @ApiFindById('Work')
  @ApiUuidParam('coverId', 'Identificador da capa a remover')
  @ApiAdminOnly()
  removeCover(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('coverId', new ParseUUIDPipe({ version: '4' })) coverId: string,
  ) {
    return this.worksService.removeCover(id, coverId);
  }
}
