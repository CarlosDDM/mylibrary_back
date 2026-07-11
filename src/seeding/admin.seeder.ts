import { Logger } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import * as bcrypt from 'bcrypt';

export class AdminSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const logger = new Logger();
    const userRepo = dataSource.getRepository(User);

    const existAdmin = await userRepo.findOneBy({ role: Role.ADMIN });
    if (existAdmin) {
      logger.warn('AdminSeeder: já existe um admin, nada a fazer.');
      return;
    }

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;

    if (!username || !password) {
      throw new Error(
        'AdminSeeder: defina ADMIN_USERNAME e ADMIN_PASSWORD no ambiente.',
      );
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    logger.log('seeding Admin');
    await userRepo.save({
      username,
      email,
      hashedPassword,
      role: Role.ADMIN,
    });
  }
}
