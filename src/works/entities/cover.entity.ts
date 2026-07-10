import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Work } from './work.entity';

@Entity('covers')
export class Cover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ name: 'is_special_edition', default: false })
  isSpecialEdition: boolean;

  @Column({ name: 'cover_order' })
  order: number;

  @Column({ name: 'work_id' })
  workId: string;

  @ManyToOne(() => Work, (work) => work.covers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'work_id' })
  work: Work;
}
