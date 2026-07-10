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
import { paginate } from 'src/common/dto/response-paginated.dto';
import { PaginatedSeriesResponse } from './dto/paginated-series.dto';
import { ResponseSeriesDto } from './dto/response-series.dto';
import { FilterSerieDto } from './dto/filter-serie-dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('series')
@SerializeOptions({ type: ResponseSeriesDto })
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  create(@Body() createSeriesDto: CreateSeriesDto) {
    return this.seriesService.create(createSeriesDto);
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedSeriesResponse })
  async findAll(@Query() filterSerieDto: FilterSerieDto) {
    const [series, total] = await this.seriesService.findAll(filterSerieDto);
    return paginate([series, total], filterSerieDto);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.seriesService.findOneById(id);
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateSeriesDto: UpdateSeriesDto,
  ) {
    return this.seriesService.update(id, updateSeriesDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.seriesService.delete({ id });
  }

  @Put(':id/cover')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  setCover(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile(ValidateImagePipe) file: Express.Multer.File,
  ) {
    return this.seriesService.setCover(id, file);
  }

  @Delete(':id/cover')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  removeCover(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.seriesService.removeCover(id);
  }
}
