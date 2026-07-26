import { Injectable, NotFoundException } from '@nestjs/common';
import { Media } from './entities/media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class MediasService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  findAll() {
    return this.mediaRepository.find();
  }

  async validateExists(where: FindOptionsWhere<Media>): Promise<void> {
    const exists = await this.mediaRepository.exists({ where });
    if (!exists) throw new NotFoundException('Media não encontrado');
  }
}
