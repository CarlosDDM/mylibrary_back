import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from './entities/status.entity';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
  ) {}

  findAll() {
    return this.statusRepository.find();
  }

  async validateExists(where: FindOptionsWhere<Status>): Promise<void> {
    const exists = await this.statusRepository.exists({ where });
    if (!exists) throw new NotFoundException('Status não encontrado');
  }
}
