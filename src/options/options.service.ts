import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Language } from '../languages/entities/language.entity';
import { Status } from '../status/entities/status.entity';
import { Media } from '../medias/entities/media.entity';

@Injectable()
export class OptionsService {
  constructor(private readonly dataSource: DataSource) {}

  private async getAllOptions() {
    return await this.dataSource.transaction(async (manager) => {
      const status = await manager.find(Status);

      const languages = await manager.find(Language);

      const medias = await manager.find(Media);

      return {
        status,
        medias,
        languages,
      };
    });
  }

  async findAll() {
    return this.getAllOptions();
  }
}
