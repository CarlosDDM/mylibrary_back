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
import { FranchisesService } from './franchises.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import { PaginatedFranchiseDto } from './dto/paginated-franchise.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';
import { ILike } from 'typeorm';
import { ResponseFranchiseDto } from './dto/response-franchise.dto';

@Controller('franchises')
@SerializeOptions({ type: ResponseFranchiseDto })
export class FranchisesController {
  constructor(private readonly franchisesService: FranchisesService) {}

  @Post()
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  create(@Body() createFranchiseDto: CreateFranchiseDto) {
    return this.franchisesService.create(createFranchiseDto);
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: PaginatedFranchiseDto })
  async findAll(@Query() paginationDto: DefaultFilterDto) {
    const where = paginationDto.name
      ? { name: ILike(`%${paginationDto.name}%`) }
      : undefined;

    const [franchises, total] = await this.franchisesService.findAll(
      paginationDto,
      where,
    );
    return paginate([franchises, total], paginationDto);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.franchisesService.findOne({ id });
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateFranchiseDto: UpdateFranchiseDto,
  ) {
    return this.franchisesService.update(id, updateFranchiseDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.franchisesService.delete({ id });
  }
}
