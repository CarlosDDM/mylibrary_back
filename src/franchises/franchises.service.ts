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

  create(createFranchiseDto: CreateFranchiseDto) {
    return 'This action adds a new franchise';
  }

  findAll() {
    return super.findAll();
  }

  update(id: number, updateFranchiseDto: UpdateFranchiseDto) {
    return `This action updates a #${id} franchise`;
  }

  remove(id: number) {
    return `This action removes a #${id} franchise`;
  }
}
