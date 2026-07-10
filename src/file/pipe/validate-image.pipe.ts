import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ValidateImagePipe implements PipeTransform {
  private readonly allowedMimeType = ['image/jpeg', 'image/png', 'image/webp'];

  transform(file: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!file || file.size === 0)
      throw new BadRequestException('Nenhum arquivo enviado');

    if (
      !file.mimetype.startsWith('image/') ||
      !this.allowedMimeType.includes(file.mimetype)
    ) {
      throw new BadRequestException('Somente imagens são permitidas');
    }

    return file;
  }
}
