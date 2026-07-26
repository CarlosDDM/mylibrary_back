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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { AddCoverDto } from './dto/add-cover.dto';
import { ValidateImagePipe } from 'src/file/pipe/validate-image.pipe';
import { ResponseWorkDto } from './dto/response-work.dto';
import { FilterWorkDto } from './dto/filter-work.dto';
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
  findAll(@Query() filterDto: FilterWorkDto) {
    return this.worksService.findAll(filterDto);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const work = await this.worksService.findOneById(id);
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

  @Post(':id/covers')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  addCover(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile(ValidateImagePipe) file: Express.Multer.File,
    @Body() addCoverDto: AddCoverDto,
  ) {
    return this.worksService.addCover(id, file, addCoverDto.isSpecialEdition);
  }

  @Delete(':id/covers/:coverId')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @Roles(Role.ADMIN)
  removeCover(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('coverId', new ParseUUIDPipe({ version: '4' })) coverId: string,
  ) {
    return this.worksService.removeCover(id, coverId);
  }
}
