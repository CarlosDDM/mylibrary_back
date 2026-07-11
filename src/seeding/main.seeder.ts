import { Language } from 'src/languages/entities/language.entity';
import { Media } from 'src/medias/entities/media.entity';
import { Status } from 'src/status/entities/status.entity';
import { LanguageType } from 'src/common/enums/language-type.enum';
import { MediaType } from 'src/common/enums/medias-type.enum';
import { StatusType } from 'src/common/enums/status-type.enum';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Logger } from '@nestjs/common';

export class MainSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const logger = new Logger();
    const mediaRepo = dataSource.getRepository(Media);

    logger.log('seeding MediaType');
    await mediaRepo.upsert(
      [
        { type: MediaType.LIGHT_NOVEL },
        { type: MediaType.MANGA },
        { type: MediaType.BOOK },
      ],
      ['type'],
    );

    const statusRepo = dataSource.getRepository(Status);

    logger.log('seeding StatusType');
    await statusRepo.upsert(
      [
        { type: StatusType.ONGOING },
        { type: StatusType.COMPLETED },
        { type: StatusType.CANCELLED },
        { type: StatusType.HIATUS },
      ],
      ['type'],
    );

    const languageRepo = dataSource.getRepository(Language);

    logger.log('seeding LanguageTypes');
    await languageRepo.upsert(
      [
        {
          type: LanguageType.PT_BR,
        },
        { type: LanguageType.EN },
      ],
      ['type'],
    );
  }
}
