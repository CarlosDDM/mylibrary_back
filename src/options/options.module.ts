import { Module } from '@nestjs/common';
import { OptionsService } from './options.service';
import { OptionsController } from './options.controller';
import { CacheModule } from '../cache/cache.module';
import { StatusModule } from 'src/status/status.module';
import { LanguagesModule } from 'src/languages/languages.module';
import { MediasModule } from 'src/medias/medias.module';

@Module({
  imports: [CacheModule, StatusModule, LanguagesModule, MediasModule],
  controllers: [OptionsController],
  providers: [OptionsService],
})
export class OptionsModule {}
