import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { s3ClientProvider } from './s3.provider';

@Module({
  providers: [FileService, s3ClientProvider],
  exports: [FileService],
})
export class FileModule {}
