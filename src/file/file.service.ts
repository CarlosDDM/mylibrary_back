import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly s3WebUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET')!;
    this.s3WebUrl = this.configService.get<string>('S3_WEB_URL')!;

    const endpoint = this.configService.get<string>('S3_API_URL');
    const accessKeyId = this.configService.get<string>('S3_KEY_ID');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');

    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION'),
      forcePathStyle:
        this.configService.get<string>('S3_PATH_STYLE') === 'true',
      ...(endpoint ? { endpoint } : {}),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  async uploadImage(file: Express.Multer.File, key: string) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { url: `${this.s3WebUrl}/${key}`, key };
  }

  async deleteImage(key: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  keyFromUrl(url: string) {
    const prefix = `${this.s3WebUrl}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }
}
