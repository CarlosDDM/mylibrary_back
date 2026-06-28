import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  SerializeOptions,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/base.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginatedUserDto } from './dto/paginated-user.dto';
import { paginate } from 'src/common/dto/response-paginated.dto';

@Controller('users')
@SerializeOptions({ type: ResponseUserDto })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @SerializeOptions({ type: PaginatedUserDto })
  async findAll(@Query() queryParams: PaginationDto) {
    const [users, total] = await this.usersService.findAll(queryParams);

    return paginate([users, total], queryParams);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne({ id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.delete({ id });
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(id, updatePasswordDto);
  }
}
