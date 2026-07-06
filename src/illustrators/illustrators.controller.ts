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
  UseGuards,
} from '@nestjs/common';
import { IllustratorsService } from './illustrators.service';
import { CreateIllustratorDto } from './dto/create-illustrator.dto';
import { UpdateIllustratorDto } from './dto/update-illustrator.dto';
import { ResponseIllustratorDto } from './dto/response-illustrator.dto';
import { PaginatedIllustratorResponse } from './dto/paginated-illustrator.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';

@Controller('illustrators')
@SerializeOptions({ type: ResponseIllustratorDto })
export class IllustratorsController {
  constructor(private readonly illustratorsService: IllustratorsService) {}

  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  create(@Body() createIllustratorDto: CreateIllustratorDto) {
    return this.illustratorsService.create(createIllustratorDto);
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedIllustratorResponse })
  async findAll(@Query() paginationDto: DefaultFilterDto) {
    const [illustrators, total] = await this.illustratorsService.findAll(
      paginationDto,
      {
        name: paginationDto?.name,
      },
    );
    return paginate([illustrators, total], paginationDto);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.illustratorsService.findOne({ id });
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RoleGuard)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIllustratorDto: UpdateIllustratorDto,
  ) {
    return this.illustratorsService.update(id, updateIllustratorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RoleGuard)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.illustratorsService.delete({ id });
  }
}
