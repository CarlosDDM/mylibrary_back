import { WorkIllustrator } from 'src/works/entities/work-illustrator.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('illustrators')
export class Illustrator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(
    () => WorkIllustrator,
    (workIllustrator) => workIllustrator.illustrator,
  )
  workIllustrators: WorkIllustrator[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
