import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  SerializeOptions,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { PaginationDto } from 'src/common/dto/base.dto';
import { PaginatedAuthorResponse } from './dto/pagination-author.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';
import { ResponseAuthorDto } from './dto/response-author.dto';

@Controller('authors')
@SerializeOptions({ type: ResponseAuthorDto })
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  @Get()
  @SerializeOptions({ type: PaginatedAuthorResponse })
  async findAll(@Query() paginationDto: PaginationDto) {
    const [authors, total] = await this.authorsService.findAll(paginationDto);
    return paginate([authors, total], paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.authorsService.findOne({ id });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.authorsService.delete({ id });
  }
}
