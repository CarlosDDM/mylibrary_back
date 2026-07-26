import { Injectable, NotFoundException } from '@nestjs/common';
import { Language } from './entities/language.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  findAll() {
    return this.languageRepository.find();
  }

  async validateExists(where: FindOptionsWhere<Language>): Promise<void> {
    const exists = await this.languageRepository.exists({ where });
    if (!exists) throw new NotFoundException('Language não encontrado');
  }
}
