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
} from '@nestjs/common';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { ResponseWorkDto } from './dto/response-work.dto';

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
  async findAll() {
    const workAll = await this.worksService.findAll();
    return workAll.map(
      (work) => new ResponseWorkDto(work as Partial<ResponseWorkDto>),
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
