import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { Media } from './entities/media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MediasService extends BaseService<Media> {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {
    super(mediaRepository, 'Media');
  }
}
