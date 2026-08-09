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
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SeriesService } from './series.service';
import { ValidateImagePipe } from 'src/file/pipe/validate-image.pipe';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { PaginatedSeriesResponse } from './dto/paginated-series.dto';
import { ResponseSeriesDto } from './dto/response-series.dto';
import { FilterSerieDto } from './dto/filter-serie.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
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
import { ApiImageUpload } from 'src/common/decorators/api-image-upload.decorator';

@ApiTags('series')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('series')
@SerializeOptions({ type: ResponseSeriesDto })
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  /** Cadastra uma série */
  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: ResponseSeriesDto })
  @ApiInvalidBody()
  @ApiConflict('Serie já existe')
  @ApiAdminOnly()
  create(@Body() createSeriesDto: CreateSeriesDto) {
    return this.seriesService.create(createSeriesDto);
  }

  /** Lista séries paginadas, com filtro por franquia e status. O filtro `name` é full text: casa prefixo de palavra e ignora acento */
  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedSeriesResponse })
  @ApiOkResponse({ type: PaginatedSeriesResponse })
  findAll(@Query() filterSerieDto: FilterSerieDto) {
    return this.seriesService.findAll(filterSerieDto);
  }

  /** Busca uma série por id, com as obras dela */
  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: ResponseSeriesDto })
  @ApiFindById('Serie')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.seriesService.findOneById(id);
  }

  /** Atualiza parcialmente uma série */
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseSeriesDto })
  @ApiFindById('Serie')
  @ApiInvalidBody()
  @ApiConflict('Serie já existe')
  @ApiAdminOnly()
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateSeriesDto: UpdateSeriesDto,
  ) {
    return this.seriesService.update(id, updateSeriesDto);
  }

  /** Remove uma série e devolve o registro apagado */
  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseSeriesDto })
  @ApiFindById('Serie')
  @ApiAdminOnly()
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.seriesService.delete({ id });
  }

  /** Define a capa da série, apagando a anterior */
  @Put(':id/cover')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiImageUpload()
  @ApiOkResponse({ type: ResponseSeriesDto })
  @ApiFindById('Serie')
  @ApiAdminOnly()
  setCover(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile(ValidateImagePipe) file: Express.Multer.File,
  ) {
    return this.seriesService.setCover(id, file);
  }

  /** Remove a capa da série */
  @Delete(':id/cover')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ResponseSeriesDto })
  @ApiFindById('Serie')
  @ApiAdminOnly()
  removeCover(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.seriesService.removeCover(id);
  }
}
