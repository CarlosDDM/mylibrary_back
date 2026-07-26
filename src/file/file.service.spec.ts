import { Test, TestingModule } from '@nestjs/testing';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { FileService } from './file.service';
import { S3_CLIENT } from './s3.provider';
import { ConfigService } from '@nestjs/config';

describe('FileService', () => {
  let service: FileService;
  let s3: { send: jest.Mock };

  const config: Record<string, string> = {
    S3_BUCKET: 'mylibrary',
    S3_WEB_URL: 'https://cdn.mylibrary.com',
  };

  beforeEach(async () => {
    s3 = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: S3_CLIENT, useValue: s3 },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => config[key]) },
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    const file = {
      buffer: Buffer.from('imagem'),
      mimetype: 'image/webp',
    } as Express.Multer.File;

    it('deveria enviar o arquivo para o bucket e devolver url e key', async () => {
      const result = await service.uploadImage(file, 'works/berserk.webp');

      const command = s3.send.mock.calls[0][0] as PutObjectCommand;
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'mylibrary',
        Key: 'works/berserk.webp',
        Body: file.buffer,
        ContentType: 'image/webp',
      });
      expect(result).toEqual({
        url: 'https://cdn.mylibrary.com/works/berserk.webp',
        key: 'works/berserk.webp',
      });
    });

    it('deveria propagar erro quando o s3 falha', async () => {
      s3.send.mockRejectedValue(new Error('s3 fora do ar'));

      await expect(
        service.uploadImage(file, 'works/berserk.webp'),
      ).rejects.toThrow('s3 fora do ar');
    });
  });

  describe('deleteImage', () => {
    it('deveria remover a key do bucket', async () => {
      await service.deleteImage('works/berserk.webp');

      const command = s3.send.mock.calls[0][0] as DeleteObjectCommand;
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'mylibrary',
        Key: 'works/berserk.webp',
      });
    });

    it('deveria propagar erro quando o s3 falha', async () => {
      s3.send.mockRejectedValue(new Error('s3 fora do ar'));

      await expect(service.deleteImage('works/berserk.webp')).rejects.toThrow(
        's3 fora do ar',
      );
    });
  });

  describe('keyFromUrl', () => {
    it('deveria entregar a key quando a url pertence ao bucket', () => {
      const result = service.keyFromUrl(
        'https://cdn.mylibrary.com/works/berserk.webp',
      );

      expect(result).toBe('works/berserk.webp');
    });

    it('deveria entregar null quando a url e de outro dominio', () => {
      const result = service.keyFromUrl(
        'https://outrocdn.com/works/berserk.webp',
      );

      expect(result).toBeNull();
    });
  });
});
