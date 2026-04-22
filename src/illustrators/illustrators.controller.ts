import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { IllustratorsService } from './illustrators.service';
import { CreateIllustratorDto } from './dto/create-illustrator.dto';
import { UpdateIllustratorDto } from './dto/update-illustrator.dto';

@Controller('illustrators')
export class IllustratorsController {
  constructor(private readonly illustratorsService: IllustratorsService) {}

  @Post()
  create(@Body() createIllustratorDto: CreateIllustratorDto) {
    return this.illustratorsService.create(createIllustratorDto);
  }

  @Get()
  findAll() {
    return this.illustratorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.illustratorsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIllustratorDto: UpdateIllustratorDto,
  ) {
    return this.illustratorsService.update(+id, updateIllustratorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.illustratorsService.remove(+id);
  }
}
