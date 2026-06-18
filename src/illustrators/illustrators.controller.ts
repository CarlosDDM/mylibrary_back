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
} from '@nestjs/common';
import { IllustratorsService } from './illustrators.service';
import { CreateIllustratorDto } from './dto/create-illustrator.dto';
import { UpdateIllustratorDto } from './dto/update-illustrator.dto';
import { ResponseIllustratorDto } from './dto/response-illustrator.dto';
import { PaginationDto } from 'src/common/dto/base.dto';
import { PaginatedIllustratorResponse } from './dto/paginated-illustrator.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';

@Controller('illustrators')
@SerializeOptions({ type: ResponseIllustratorDto })
export class IllustratorsController {
  constructor(private readonly illustratorsService: IllustratorsService) {}

  @Post()
  create(@Body() createIllustratorDto: CreateIllustratorDto) {
    return this.illustratorsService.create(createIllustratorDto);
  }

  @Get()
  @SerializeOptions({ type: PaginatedIllustratorResponse })
  async findAll(@Query() paginationDto: PaginationDto) {
    const [illustrators, total] =
      await this.illustratorsService.findAll(paginationDto);
    return paginate([illustrators, total], paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.illustratorsService.findOne({ id });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIllustratorDto: UpdateIllustratorDto,
  ) {
    return this.illustratorsService.update(id, updateIllustratorDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.illustratorsService.delete({ id });
  }
}
