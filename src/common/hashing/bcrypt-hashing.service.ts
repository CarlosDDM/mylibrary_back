import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BcryptHashingService extends HashingService {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(
      Number(this.configService.get<number>('SALT')) || 10,
    );

    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    const isValid = await bcrypt.compare(password, hash);

    return isValid;
  }
}
