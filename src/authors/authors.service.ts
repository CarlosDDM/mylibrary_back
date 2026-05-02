import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { BaseService } from 'src/common/base.service';
import { Author } from './entities/author.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class AuthorsService extends BaseService<Author> {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
  ) {
    super(authorRepository, 'Author');
  }
  private async validateAuthorData(dto: CreateAuthorDto | UpdateAuthorDto) {
    if (dto.name) {
      await this.validateNotExists({ name: dto.name });
    }
  }

  async ensureAllExist(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const count = await this.repository.count({ where: { id: In(ids) } });
    if (count !== ids.length) {
      throw new NotFoundException('Um ou mais Authors não foram encontrados');
    }
  }

  async create(createAuthorDto: CreateAuthorDto) {
    await this.validateAuthorData(createAuthorDto);

    const result = await this.repository.save(createAuthorDto);
    return this.findOne({ id: result.id });
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto) {
    const result = await this.findOne({ id });

    if (updateAuthorDto.name !== result.name) {
      await this.validateAuthorData(updateAuthorDto);
      await this.repository.update({ id }, updateAuthorDto);
      return this.findOne({ id });
    }

    return result;
  }
}
