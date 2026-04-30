import { Injectable } from '@nestjs/common';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { BaseService } from 'src/common/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Work } from './entities/work.entity';
import { Repository } from 'typeorm';
import { SeriesService } from 'src/series/series.service';
import { MediasService } from 'src/medias/medias.service';
import { LanguagesService } from 'src/languages/languages.service';

@Injectable()
export class WorksService extends BaseService<Work> {
  constructor(
    @InjectRepository(Work)
    private readonly workRepository: Repository<Work>,
    private readonly serieService: SeriesService,
    private readonly mediaService: MediasService,
    private readonly languageService: LanguagesService,
  ) {
    super(workRepository, 'Work', {
      covers: true,
      media: true,
      language: true,
      workAuthors: true,
      workIllustrators: true,
      serie: true,
    });
  }

  private async validateWorkData(dto: CreateWorkDto | UpdateWorkDto) {
    if (dto.serieId) {
      await this.serieService.validateExists({ id: dto.serieId });
    }

    if (dto.mediaId) {
      await this.mediaService.validateExists({ id: dto.mediaId });
    }

    if (dto.languageId) {
      await this.languageService.validateExists({ id: dto.languageId });
    }

    if (dto.volume) {
      await this.validateNotExists({
        serieId: dto.serieId,
        volume: dto.volume,
      });
    }
  }

  async create(createWorkDto: CreateWorkDto) {
    await this.validateWorkData(createWorkDto);

    const result = await this.repository.save(createWorkDto);

    return this.findOne({ id: result.id });
  }

  update(id: number, updateWorkDto: UpdateWorkDto) {
    return `This action updates a #${id} work`;
  }
}
