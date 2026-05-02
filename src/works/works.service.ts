import { ConflictException, Injectable } from '@nestjs/common';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { BaseService } from 'src/common/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Work } from './entities/work.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { SeriesService } from 'src/series/series.service';
import { MediasService } from 'src/medias/medias.service';
import { LanguagesService } from 'src/languages/languages.service';
import { AuthorsService } from 'src/authors/authors.service';
import { IllustratorsService } from 'src/illustrators/illustrators.service';
import { WorkAuthor } from './entities/work-author.entity';
import { WorkIllustrator } from './entities/work-illustrator.entity';

@Injectable()
export class WorksService extends BaseService<Work> {
  constructor(
    @InjectRepository(Work)
    private readonly workRepository: Repository<Work>,
    private readonly serieService: SeriesService,
    private readonly mediaService: MediasService,
    private readonly languageService: LanguagesService,
    private readonly authorService: AuthorsService,
    private readonly illustratorService: IllustratorsService,
    private readonly dataSource: DataSource,
  ) {
    super(workRepository, 'Work', {
      covers: true,
      media: true,
      language: true,
      workAuthors: {
        author: true,
      },
      workIllustrators: {
        illustrator: true,
      },
      serie: true,
    });
  }

  private async validateWorkData(
    dto: CreateWorkDto | UpdateWorkDto,
    validateWork = true,
  ) {
    if (dto.serieId) {
      await this.serieService.validateExists({ id: dto.serieId });
    }

    if (dto.mediaId) {
      await this.mediaService.validateExists({ id: dto.mediaId });
    }

    if (dto.languageId) {
      await this.languageService.validateExists({ id: dto.languageId });
    }

    if (dto.authors && dto.authors.length > 0) {
      await this.authorService.ensureAllExist(dto.authors);
    }

    if (dto.illustrators && dto.illustrators.length > 0) {
      await this.illustratorService.ensureAllExist(dto.illustrators);
    }

    if (validateWork && dto.volume && dto.serieId) {
      await this.validateNotExists({
        serieId: dto.serieId,
        volume: dto.volume,
      });
    }
  }

  private async syncAuthors(
    manager: EntityManager,
    id: string,
    work: Work,
    authors?: string[],
  ) {
    if (!authors) return;

    const current = work.workAuthors.map((a) => a.authorId);
    const toAdd = authors.filter((authorId) => !current.includes(authorId));
    const toRemove = current.filter((authorId) => !authors.includes(authorId));

    if (toRemove.length > 0) {
      await manager.delete(WorkAuthor, { workId: id, authorId: In(toRemove) });
    }
    if (toAdd.length > 0) {
      const entities = toAdd.map((authorId) =>
        manager.create(WorkAuthor, { workId: id, authorId }),
      );
      await manager.save(entities);
    }
  }

  private async syncIllustrators(
    manager: EntityManager,
    id: string,
    work: Work,
    illustrators?: string[],
  ) {
    if (!illustrators) return;

    const current = work.workIllustrators.map((i) => i.illustratorId);
    const toAdd = illustrators.filter(
      (illustratorId) => !current.includes(illustratorId),
    );
    const toRemove = current.filter(
      (illustratorId) => !illustrators.includes(illustratorId),
    );

    if (toRemove.length > 0) {
      await manager.delete(WorkIllustrator, {
        workId: id,
        illustratorId: In(toRemove),
      });
    }
    if (toAdd.length > 0) {
      const entities = toAdd.map((illustratorId) =>
        manager.create(WorkIllustrator, { workId: id, illustratorId }),
      );
      await manager.save(entities);
    }
  }

  private async validateSeriesVolume(
    manager: EntityManager,
    id: string,
    work: Work,
    workData: UpdateWorkDto,
  ) {
    const serieId = workData.serieId ?? work.serieId;
    const volume = workData.volume ?? work.volume;

    if (!serieId || volume == null) return;

    const conflict = await manager.findOne(Work, {
      where: { serieId, volume },
    });

    if (conflict && conflict.id !== id) {
      throw new ConflictException(`Volume ${volume} já existe para essa serie`);
    }
  }

  async create(createWorkDto: CreateWorkDto) {
    await this.validateWorkData(createWorkDto);
    const serie = createWorkDto.serieId
      ? await this.serieService.findOne({ id: createWorkDto.serieId })
      : null;

    return this.dataSource.transaction(async (manager) => {
      const { authors, illustrators, ...workData } = createWorkDto;

      const work = manager.create(Work, {
        ...workData,
        name: createWorkDto.name ?? serie?.name,
      });

      const savedWork = await manager.save(Work, work);

      if (authors && authors.length > 0) {
        const workAuthors = authors.map((authorId) =>
          manager.create(WorkAuthor, {
            workId: savedWork.id,
            authorId,
          }),
        );
        await manager.save(workAuthors);
      }

      if (illustrators && illustrators.length > 0) {
        const workIllustrators = illustrators.map((illustratorId) =>
          manager.create(WorkIllustrator, {
            workId: savedWork.id,
            illustratorId,
          }),
        );
        await manager.save(workIllustrators);
      }

      return manager.findOne(Work, {
        where: { id: savedWork.id },
        relations: this.relations,
      });
    });
  }

  async update(id: string, updateWorkDto: UpdateWorkDto) {
    await this.validateWorkData(updateWorkDto, false);
    const work = await this.findOne({ id });

    return this.dataSource.transaction(async (manager) => {
      const { authors, illustrators, ...workData } = updateWorkDto;

      await this.validateSeriesVolume(manager, id, work, workData);
      await manager.update(Work, { id }, workData);
      await this.syncAuthors(manager, id, work, authors);
      await this.syncIllustrators(manager, id, work, illustrators);

      return manager.findOne(Work, {
        where: { id },
        relations: this.relations,
      });
    });
  }
}
