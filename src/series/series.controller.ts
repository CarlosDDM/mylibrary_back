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
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { ResponseSeriesDto } from './dto/response-series.dto';
import { PaginationDto } from 'src/common/dto/base.dto';
import { paginate } from 'src/common/utils/paginate.utils';

@Controller('series')
@UseInterceptors(ClassSerializerInterceptor)
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  create(@Body() createSeriesDto: CreateSeriesDto) {
    return this.seriesService.create(createSeriesDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const [series, total] = await this.seriesService.findAll(paginationDto);
    return paginate(
      [series.map((serie) => new ResponseSeriesDto(serie)), total],
      paginationDto,
    );
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
