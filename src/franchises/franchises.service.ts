import { Injectable } from '@nestjs/common';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Franchise } from './entities/franchise.entity';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class FranchisesService extends BaseService<Franchise> {
  constructor(
    @InjectRepository(Franchise)
    private readonly franchiseRepository: Repository<Franchise>,
  ) {
    super(franchiseRepository, 'Franchise', { series: true });
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
    const newFranchise = this.repository.save(createFranchiseDto);

    return this.findOne({ id: (await newFranchise).id });
  }

  async update(id: string, updateFranchiseDto: UpdateFranchiseDto) {
    const franchise = await this.findOne({ id });

    if (updateFranchiseDto.name !== franchise.name) {
      await this.validateFranchise(updateFranchiseDto);

      await this.repository.update({ id }, updateFranchiseDto);

      return this.findOne({ id });
    }

    await this.repository.update({ id }, updateFranchiseDto);

    return this.findOne({ id });
  }
}
