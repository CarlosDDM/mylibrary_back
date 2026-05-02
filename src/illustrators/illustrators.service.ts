import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIllustratorDto } from './dto/create-illustrator.dto';
import { UpdateIllustratorDto } from './dto/update-illustrator.dto';
import { BaseService } from 'src/common/base.service';
import { Illustrator } from './entities/illustrator.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class IllustratorsService extends BaseService<Illustrator> {
  constructor(
    @InjectRepository(Illustrator)
    private readonly illustratorRepository: Repository<Illustrator>,
  ) {
    super(illustratorRepository, 'Illustrator');
  }

  private async validateIllustratorData(
    dto: CreateIllustratorDto | UpdateIllustratorDto,
  ) {
    if (dto.name) {
      await this.validateNotExists({ name: dto.name });
    }
  }

  async ensureAllExist(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const count = await this.repository.count({ where: { id: In(ids) } });
    if (count !== ids.length) {
      throw new NotFoundException(
        `Um ou mais Illustrator não foram encontrados`,
      );
    }
  }

  async create(createIllustratorDto: CreateIllustratorDto) {
    await this.validateIllustratorData(createIllustratorDto);

    const result = await this.repository.save(createIllustratorDto);
    return this.findOne({ id: result.id });
  }

  async update(id: string, updateIllustratorDto: UpdateIllustratorDto) {
    const result = await this.findOne({ id });

    if (updateIllustratorDto.name !== result.name) {
      await this.validateIllustratorData(updateIllustratorDto);
      await this.repository.update({ id }, updateIllustratorDto);

      return this.findOne({ id });
    }
    return result;
  }
}
