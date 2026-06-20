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
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { PaginationDto } from 'src/common/dto/base.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';
import { PaginatedSeriesResponse } from './dto/paginated-series.dto';
import { ResponseSeriesDto } from './dto/response-series.dto';
import { FilterSerieDto } from './dto/filter-serie-dto';

@Controller('series')
@SerializeOptions({ type: ResponseSeriesDto })
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  create(@Body() createSeriesDto: CreateSeriesDto) {
    return this.seriesService.create(createSeriesDto);
  }

  @Get()
  @SerializeOptions({ type: PaginatedSeriesResponse })
  async findAll(@Query() filterSerieDto: FilterSerieDto) {
    const [series, total] = await this.seriesService.findAll(filterSerieDto);
    return paginate([series, total], filterSerieDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.seriesService.findOne({ id });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSeriesDto: UpdateSeriesDto,
  ) {
    return this.seriesService.update(id, updateSeriesDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.seriesService.delete({ id });
  }
}
