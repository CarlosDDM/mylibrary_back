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
  UseGuards,
} from '@nestjs/common';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { ResponseWorkDto } from './dto/response-work.dto';
import { FilterWorkDto } from './dto/filter-work.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';
import { PaginatedWorkResponse } from './dto/paginated-work.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/auth/guards/role.guard';

@Controller('works')
@SerializeOptions({ type: ResponseWorkDto })
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createWorkDto: CreateWorkDto) {
    const work = await this.worksService.create(createWorkDto);
    return work;
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedWorkResponse })
  async findAll(@Query() filterDto: FilterWorkDto) {
    const [works, total] = await this.worksService.findAll(filterDto);
    return paginate([works, total], filterDto);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const work = await this.worksService.findOne({ id });
    return work;
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateWorkDto: UpdateWorkDto,
  ) {
    const work = await this.worksService.update(id, updateWorkDto);
    return work;
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const work = await this.worksService.delete({ id });
    return work;
  }
}
