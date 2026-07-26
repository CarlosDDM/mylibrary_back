import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export const S3_CLIENT = Symbol('S3_CLIENT');

export const s3ClientProvider: Provider = {
  provide: S3_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const endpoint = config.get<string>('S3_API_URL');
    const accessKeyId = config.get<string>('S3_KEY_ID');
    const secretAccessKey = config.get<string>('S3_SECRET_KEY');

    return new S3Client({
      region: config.get<string>('S3_REGION'),
      forcePathStyle: config.get<string>('S3_PATH_STYLE') === 'true',
      ...(endpoint ? { endpoint } : {}),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  },
};
