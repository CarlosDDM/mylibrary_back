import { Injectable } from '@nestjs/common';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Serie } from './entities/serie.entity';
import { Repository } from 'typeorm';
import { StatusService } from 'src/status/status.service';
import { FranchisesService } from 'src/franchises/franchises.service';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class SeriesService extends BaseService<Serie> {
  constructor(
    @InjectRepository(Serie)
    private readonly serieRepository: Repository<Serie>,
    private readonly statusService: StatusService,
    private readonly franchiseService: FranchisesService,
  ) {
    super(serieRepository, 'Serie', { status: true, franchise: true });
  }

  private async validateSerieData(
    dto: CreateSeriesDto | UpdateSeriesDto,
    validateName = true,
  ) {
    if (dto.statusId) {
      await this.statusService.validateExists({ id: dto.statusId });
    }

    if (dto.franchiseId) {
      await this.franchiseService.validateExists({ id: dto.franchiseId });
    }

    if (validateName && dto.name) {
      await this.validateNotExists({ name: dto.name });
    }
  }

  async create(createSeriesDto: CreateSeriesDto) {
    await this.validateSerieData(createSeriesDto);

    const newSerie = await this.repository.save(createSeriesDto);

    return this.findOne({ id: newSerie.id });
  }

  async update(id: string, updateSeriesDto: UpdateSeriesDto) {
    const serie = await this.findOne({ id });

    if (serie && serie.name !== updateSeriesDto.name) {
      await this.validateSerieData(updateSeriesDto);

      await this.repository.update({ id }, updateSeriesDto);

      return this.findOne({ id });
    }

    await this.validateSerieData(updateSeriesDto, false);

    await this.repository.update({ id }, updateSeriesDto);

    return this.findOne({ id });
  }
}
