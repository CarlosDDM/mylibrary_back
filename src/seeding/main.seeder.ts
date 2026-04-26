import { Language } from 'src/languages/entities/language.entity';
import { Media } from 'src/medias/entities/media.entity';
import { Status } from 'src/status/entities/status.entity';
import { LanguageType } from 'src/utils/enums/language-type.enum';
import { MediaType } from 'src/utils/enums/medias-type.enum';
import { StatusType } from 'src/utils/enums/status-type.enum';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export class MainSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const MediaRepo = dataSource.getRepository(Media);

    console.clear();
    console.log('seeding MediaType');
    const MediasTypes = await MediaRepo.save([
      { type: MediaType.LIGHT_NOVEL },
      { type: MediaType.MANGA },
      { type: MediaType.BOOKS },
    ]);

    const StatusRepo = dataSource.getRepository(Status);

    console.log('seeding StatusType');
    const StatusTypes = await StatusRepo.save([
      { type: StatusType.ONGOING },
      { type: StatusType.COMPLETED },
      { type: StatusType.CANCELLED },
      { type: StatusType.HIATUS },
    ]);

    const LanguageRepo = dataSource.getRepository(Language);

    console.log('seeding LanguageTypes');
    const LanguageTypes = await LanguageRepo.save([
      {
        type: LanguageType.PT_BR,
      },
      { type: LanguageType.EN },
    ]);
  }
}
