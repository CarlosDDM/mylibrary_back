import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';

import type { FindOptionsRelations } from 'typeorm';
import { PaginationDto } from './dto/base.dto';
import { DefaultFilterDto } from './dto/default-filter.dto';

@Injectable()
export abstract class BaseService<T extends ObjectLiteral> {
  constructor(
    protected readonly repository: Repository<T>,
    private readonly entityName: string,
    protected readonly relations?: FindOptionsRelations<T>,
  ) {}

  async validateExists(where: FindOptionsWhere<T>): Promise<void> {
    const exists = await this.repository.exists({ where });
    if (!exists)
      throw new NotFoundException(`${this.entityName} não encontrado`);
  }

  async validateNotExists(where: FindOptionsWhere<T>): Promise<void> {
    const exists = await this.repository.exists({ where });
    if (exists) throw new ConflictException(`${this.entityName} já existe`);
  }

  findAll(
    { take = 20, skip = 0 }: DefaultFilterDto,
    where?: FindOptionsWhere<T>,
  ) {
    return this.repository.findAndCount({
      relations: this.relations,
      relationLoadStrategy: 'query',
      take,
      skip,
      where,
    });
  }

  async findOne(where: FindOptionsWhere<T>) {
    const result = await this.repository.findOne({
      where,
      relations: this.relations,
    });

    if (!result) {
      throw new NotFoundException(`${this.entityName} não encontrado`);
    }

    return result;
  }

  async delete(where: FindOptionsWhere<T>) {
    const result = await this.findOne(where);
    await this.repository.delete(where);
    return result;
  }

  protected findAllBase(
    { take = 20, skip = 0 }: PaginationDto,
    where?: FindOptionsWhere<T>,
  ) {
    return this.repository.findAndCount({
      where,
      take,
      skip,
    });
  }

  search({ take = 10, skip = 0 }: PaginationDto, where: FindOptionsWhere<T>) {
    return this.findAllBase({ take, skip }, where);
  }
}
