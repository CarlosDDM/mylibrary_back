import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3_CLIENT } from './s3.provider';

@Injectable()
export class FileService {
  private readonly bucket: string;
  private readonly s3WebUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
  ) {
    this.bucket = this.configService.get<string>('S3_BUCKET')!;
    this.s3WebUrl = this.configService.get<string>('S3_WEB_URL')!;
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
