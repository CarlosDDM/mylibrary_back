import { Module } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { Language } from './entities/language.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Language])],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
