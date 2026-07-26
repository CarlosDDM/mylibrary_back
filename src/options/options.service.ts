import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { STATIC_TTL_MS } from '../cache/cache.constants';
import { StatusService } from 'src/status/status.service';
import { MediasService } from 'src/medias/medias.service';
import { LanguagesService } from 'src/languages/languages.service';

const OPTIONS_CACHE_KEY = 'options';

@Injectable()
export class OptionsService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly languageService: LanguagesService,
    private readonly statusService: StatusService,
    private readonly mediasService: MediasService,
  ) {}

  private async getAllOptions() {
    const [status, medias, languages] = await Promise.all([
      this.statusService.findAll(),
      this.mediasService.findAll(),
      this.languageService.findAll(),
    ]);

    return { status, medias, languages };
  }

  async findAll() {
    return this.cacheService.wrap(
      OPTIONS_CACHE_KEY,
      () => this.getAllOptions(),
      STATIC_TTL_MS,
    );
  }
}
