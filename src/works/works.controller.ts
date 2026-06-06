import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { ResponseWorkDto } from './dto/response-work.dto';
import { PaginationDto } from 'src/common/dto/base.dto';
import { paginate } from 'src/common/utils/paginate.utils';

@Controller('works')
@UseInterceptors(ClassSerializerInterceptor)
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Post()
  async create(@Body() createWorkDto: CreateWorkDto) {
    const work = await this.worksService.create(createWorkDto);
    return new ResponseWorkDto(work as Partial<ResponseWorkDto>);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const [works, total] = await this.worksService.findAll(paginationDto);
    return paginate(
      [
        works.map(
          (work) => new ResponseWorkDto(work as Partial<ResponseWorkDto>),
        ),
        total,
      ],
      paginationDto,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const work = await this.worksService.findOne({ id });
    return new ResponseWorkDto(work as Partial<ResponseWorkDto>);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkDto: UpdateWorkDto,
  ) {
    const work = await this.worksService.update(id, updateWorkDto);
    return new ResponseWorkDto(work as Partial<ResponseWorkDto>);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const work = await this.worksService.delete({ id });
    return new ResponseWorkDto(work as Partial<ResponseWorkDto>);
  }
}
