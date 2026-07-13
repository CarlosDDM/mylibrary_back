import { Injectable } from '@nestjs/common';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Serie } from './entities/serie.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { StatusService } from 'src/status/status.service';
import { FranchisesService } from 'src/franchises/franchises.service';
import { BaseService } from 'src/common/base.service';
import { FilterSerieDto } from './dto/filter-serie-dto';
import { CacheService } from 'src/cache/cache.service';
import { serieCacheKey } from 'src/cache/cache.keys';
import { FileService } from 'src/file/file.service';
import { generateImageFilename } from 'src/common/utils/generate-image-filename.utils';

@Injectable()
export class SeriesService extends BaseService<Serie> {
  constructor(
    @InjectRepository(Serie)
    private readonly serieRepository: Repository<Serie>,
    private readonly statusService: StatusService,
    private readonly franchiseService: FranchisesService,
    private readonly cacheService: CacheService,
    private readonly fileService: FileService,
  ) {
    super(serieRepository, 'Serie', {
      status: true,
      franchise: true,
      works: {
        covers: true,
        language: true,
        media: true,
        workAuthors: { author: true },
        workIllustrators: { illustrator: true },
      },
    });
  }

  findOneById(id: string) {
    return this.cacheService.wrap(serieCacheKey(id), () =>
      this.findOne({ id }),
    );
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
    const nameChanged = serie.name !== updateSeriesDto.name;

    await this.validateSerieData(updateSeriesDto, nameChanged);

    await this.repository.update({ id }, updateSeriesDto);

    await this.cacheService.del(serieCacheKey(id));

    return this.findOne({ id });
  }

  async delete(where: FindOptionsWhere<Serie>) {
    const serie = await super.delete(where);

    await this.cacheService.del(serieCacheKey(serie.id));

    if (serie.coverUrl) {
      await this.removeCoverObject(serie.coverUrl);
    }

    return serie;
  }

  async setCover(id: string, file: Express.Multer.File) {
    const serie = await this.findOne({ id });
    const previousUrl = serie.coverUrl;

    const key = `series/${generateImageFilename(file.originalname)}`;
    const { url } = await this.fileService.uploadImage(file, key);

    await this.repository.update({ id }, { coverUrl: url });
    await this.cacheService.del(serieCacheKey(id));

    if (previousUrl) {
      await this.removeCoverObject(previousUrl);
    }

    return this.findOne({ id });
  }

  async removeCover(id: string) {
    const serie = await this.findOne({ id });

    if (serie.coverUrl) {
      await this.repository.update({ id }, { coverUrl: null });
      await this.cacheService.del(serieCacheKey(id));
      await this.removeCoverObject(serie.coverUrl);
    }

    return this.findOne({ id });
  }

  private async removeCoverObject(url: string) {
    const key = this.fileService.keyFromUrl(url);
    if (key) await this.fileService.deleteImage(key);
  }

  async findAll({
    take = 20,
    skip = 0,
    name,
    franchiseIds,
    statusIds,
  }: FilterSerieDto): Promise<[Serie[], number]> {
    const qb = this.repository
      .createQueryBuilder('serie')
      .leftJoinAndSelect('serie.status', 'status')
      .leftJoinAndSelect('serie.franchise', 'franchise')
      .orderBy('serie.updatedAt', 'DESC')
      .take(take)
      .skip(skip);

    if (name) {
      qb.andWhere('serie.name ILIKE :name', { name: `%${name}%` });
    }

    if (franchiseIds?.length) {
      qb.andWhere('franchise.id IN (:...franchiseIds)', { franchiseIds });
    }

    if (statusIds?.length) {
      qb.andWhere('status.id IN (:...statusIds)', { statusIds });
    }

    return qb.getManyAndCount();
  }
}
