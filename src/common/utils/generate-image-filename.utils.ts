import path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export function generateImageFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase().trim();

  if (!allowedExtensions.has(extension))
    throw new BadRequestException('Extensão não permitida ou não existe');
  return `${uuidV4()}${extension}`;
}
