import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';

import type { FindOptionsRelations } from 'typeorm';
import { PaginationDto } from './dto/base.dto';
import { DefaultFilterDto } from './dto/default-filter.dto';
import { paginate } from './dto/response-paginated.dto';
import { searchByFullText } from './utils/full-text-search.utils';
import { CacheService } from 'src/cache/cache.service';
import { cacheKeyById, cacheKey } from 'src/cache/cache.keys';

@Injectable()
export abstract class BaseService<T extends ObjectLiteral> {
  constructor(
    protected readonly repository: Repository<T>,
    private readonly entityName: string,
    protected readonly relations?: FindOptionsRelations<T>,
    private readonly cache?: CacheService,
  ) {}

  protected get cacheKeyById() {
    return cacheKeyById[this.entityName];
  }

  protected get cacheKey() {
    return cacheKey[this.entityName];
  }

  async validateExists(where: FindOptionsWhere<T>): Promise<void> {
    const exists = await this.repository.exists({ where });
    if (!exists)
      throw new NotFoundException(`${this.entityName} não encontrado`);
  }

  async validateNotExists(where: FindOptionsWhere<T>): Promise<void> {
    const exists = await this.repository.exists({ where });
    if (exists) throw new ConflictException(`${this.entityName} já existe`);
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
    await this.invalidateCache((result as unknown as { id: string }).id);
    return result;
  }

  protected findAllBase(
    { take = 20, skip = 0 }: PaginationDto,
    where?: FindOptionsWhere<T>,
    relations?: FindOptionsRelations<T>,
  ) {
    return this.repository.findAndCount({
      where,
      relations,
      relationLoadStrategy: 'query',
      take,
      skip,
    });
  }

  async findOneByCache(id: string) {
    if (!this.cache || !this.cacheKeyById) {
      return this.findOne({ id } as unknown as FindOptionsWhere<T>);
    }

    return this.cache.wrap(this.cacheKeyById(id), () =>
      this.findOne({ id } as unknown as FindOptionsWhere<T>),
    );
  }

  protected async cacheList<R>(
    params: Record<string, unknown>,
    loader: () => Promise<R>,
  ): Promise<R> {
    if (!this.cache || !this.cacheKey) {
      return loader();
    }
    const key = `${this.cacheKey}list:${JSON.stringify(params)}`;
    return this.cache.wrap(key, loader);
  }

  async findAllByCache(
    paginationDto: PaginationDto,
    where?: FindOptionsWhere<T>,
  ) {
    const { take = 20, skip = 0 } = paginationDto;
    return this.cacheList({ take, skip, where: where ?? {} }, async () =>
      paginate(await this.findAllBase({ take, skip }, where, this.relations), {
        take,
        skip,
      }),
    );
  }

  async findAllByName({ name, take = 20, skip = 0 }: DefaultFilterDto) {
    if (!name) return this.findAllByCache({ take, skip });

    return this.cacheList({ take, skip, name }, async () =>
      paginate(
        await searchByFullText(this.repository, {
          term: name,
          take,
          skip,
          columns: ['name'],
          relations: this.relations,
        }),
        { take, skip },
      ),
    );
  }

  protected async invalidateId(id: string) {
    if (this.cache && this.cacheKeyById)
      await this.cache.del(this.cacheKeyById(id));
  }

  protected async invalidateList() {
    if (this.cache && this.cacheKey)
      await this.cache.invalidateByPrefix(`${this.cacheKey}list:`);
  }

  protected async invalidateKey(key: string) {
    if (this.cache) await this.cache.del(key);
  }

  async invalidateCache(id: string) {
    await Promise.all([this.invalidateId(id), this.invalidateList()]);
  }
}
