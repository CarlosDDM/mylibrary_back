import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';

import type { FindOptionsRelations } from 'typeorm';

@Injectable()
export abstract class BaseService<T extends ObjectLiteral> {
  constructor(
    protected readonly repository: Repository<T>,
    private readonly entityName: string,
    private readonly relations?: FindOptionsRelations<T>,
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

  findAll() {
    return this.repository.find({ relations: this.relations });
  }

  async findOne(where: FindOptionsWhere<T>) {
    await this.validateExists(where);
    return this.repository.findOne({ where, relations: this.relations });
  }

  async delete(where: FindOptionsWhere<T>) {
    const result = await this.findOne(where);
    await this.repository.delete(where);
    return result;
  }
}
