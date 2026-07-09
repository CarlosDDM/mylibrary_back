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
  UseGuards,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { PaginatedAuthorResponse } from './dto/pagination-author.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';
import { ResponseAuthorDto } from './dto/response-author.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';
import { ILike } from 'typeorm';

@Controller('authors')
@SerializeOptions({ type: ResponseAuthorDto })
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedAuthorResponse })
  async findAll(@Query() paginationDto: DefaultFilterDto) {
    const where = paginationDto.name
      ? { name: ILike(`%${paginationDto.name}%`) }
      : undefined;

    const [authors, total] = await this.authorsService.findAll(
      paginationDto,
      where,
    );
    return paginate([authors, total], paginationDto);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.authorsService.findOne({ id });
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.authorsService.delete({ id });
  }
}
