import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { Media } from './entities/media.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  providers: [MediasService],
  exports: [MediasService],
})
export class MediasModule {}
