import { Injectable } from '@nestjs/common';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Franchise } from './entities/franchise.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseService } from 'src/common/base.service';
import { CacheService } from 'src/cache/cache.service';
import { DASHBOARD_STATS_KEY } from 'src/cache/cache.keys';

@Injectable()
export class FranchisesService extends BaseService<Franchise> {
  constructor(
    @InjectRepository(Franchise)
    private readonly franchiseRepository: Repository<Franchise>,
    cacheService: CacheService,
  ) {
    super(franchiseRepository, 'Franchise', { series: true }, cacheService);
  }

  private async validateFranchise(
    dto: CreateFranchiseDto | UpdateFranchiseDto,
  ) {
    if (dto.name) {
      await this.validateNotExists({ name: dto.name });
    }
  }

  async create(createFranchiseDto: CreateFranchiseDto) {
    await this.validateFranchise(createFranchiseDto);
    const newFranchise = await this.repository.save(createFranchiseDto);
    await this.invalidateList();
    await this.invalidateKey(DASHBOARD_STATS_KEY);

    return this.findOne({ id: newFranchise.id });
  }

  async delete(where: FindOptionsWhere<Franchise>) {
    const result = await super.delete(where);
    await this.invalidateKey(DASHBOARD_STATS_KEY);

    return result;
  }

  async update(id: string, updateFranchiseDto: UpdateFranchiseDto) {
    const franchise = await this.findOne({ id });

    if (updateFranchiseDto.name && updateFranchiseDto.name !== franchise.name) {
      await this.validateFranchise(updateFranchiseDto);
    }

    await this.repository.update({ id }, updateFranchiseDto);
    await this.invalidateCache(id);

    return this.findOne({ id });
  }
}
