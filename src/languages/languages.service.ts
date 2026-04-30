import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { Language } from './entities/language.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LanguagesService extends BaseService<Language> {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {
    super(languageRepository, 'Language');
  }
}
