import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Work, (work) => work.covers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'work_id' })
  work: Work;
}
