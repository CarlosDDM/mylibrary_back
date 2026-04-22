import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Serie } from './serie.entity';
import { StatusType } from 'src/utils/enums/status-type-enum';

@Entity('status')
export class Status {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: StatusType, unique: true })
  type: StatusType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Serie, (serie) => serie.status)
  series: Serie[];
}
