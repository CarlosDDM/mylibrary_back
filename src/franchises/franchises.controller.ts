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
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { FranchisesService } from './franchises.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import { PaginationDto } from 'src/common/dto/base.dto';
import { paginate } from 'src/common/utils/paginate.utils';
import { ResponseFranchiseDto } from './dto/response-franchise.dto';

@Controller('franchises')
@UseInterceptors(ClassSerializerInterceptor)
export class FranchisesController {
  constructor(private readonly franchisesService: FranchisesService) {}

  @Post()
  create(@Body() createFranchiseDto: CreateFranchiseDto) {
    return this.franchisesService.create(createFranchiseDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const [franchises, total] =
      await this.franchisesService.findAll(paginationDto);
    return paginate(
      [
        franchises.map((franchise) => new ResponseFranchiseDto(franchise)),
        total,
      ],
      paginationDto,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.franchisesService.findOne({ id });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFranchiseDto: UpdateFranchiseDto,
  ) {
    return this.franchisesService.update(id, updateFranchiseDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.franchisesService.delete({ id });
  }
}
