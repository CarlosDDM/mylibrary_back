import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Serie } from './entities/serie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Serie)
    private readonly serieRepository: Repository<Serie>,
  ) {}

  private async validateExistSerie(name: string) {
    const exist = await this.serieRepository.exists({
      where: {
        name,
      },
    });

    if (exist) throw new ConflictException('Serie já existe');
  }

  async create(createSeriesDto: CreateSeriesDto) {
    await this.validateExistSerie(createSeriesDto.name);

    const newSerie = await this.serieRepository.save({
      name: createSeriesDto.name,
      serieVolumes: createSeriesDto.serieVolumes,
      status: { id: createSeriesDto.statusId },
      franchise: createSeriesDto.franchiseId
        ? { id: createSeriesDto.franchiseId }
        : null,
    });

    return this.serieRepository.findOne({
      where: { id: newSerie.id },
      relations: ['status', 'franchise'],
    });
  }

  findAll() {
    return this.serieRepository.find({
      relations: ['status', 'franchise'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} series`;
  }

  update(id: number, updateSeriesDto: UpdateSeriesDto) {
    return `This action updates a #${id} series`;
  }

  remove(id: number) {
    return `This action removes a #${id} series`;
  }
}
