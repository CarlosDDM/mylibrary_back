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
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { ResponseWorkDto } from './dto/response-work.dto';
import { FilterWorkDto } from './dto/filter-work.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';
import { PaginatedWorkResponse } from './dto/paginated-work.dto';

@Controller('works')
@SerializeOptions({ type: ResponseWorkDto })
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Post()
  async create(@Body() createWorkDto: CreateWorkDto) {
    const work = await this.worksService.create(createWorkDto);
    return work;
  }

  @Get()
  @SerializeOptions({ type: PaginatedWorkResponse })
  async findAll(@Query() filterDto: FilterWorkDto) {
    const [works, total] = await this.worksService.findAll(filterDto);
    return paginate([works, total], filterDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const work = await this.worksService.findOne({ id });
    return work;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkDto: UpdateWorkDto,
  ) {
    const work = await this.worksService.update(id, updateWorkDto);
    return work;
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const work = await this.worksService.delete({ id });
    return work;
  }
}
