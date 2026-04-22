import { Work } from 'src/works/entities/work.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Status } from './status.entity';
import { Franchise } from 'src/franchises/entities/franchise.entity';

@Entity('series')
export class Serie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'series_volumes', default: 0 })
  seriesVolumes: number;

  @OneToMany(() => Work, (work) => work.serie)
  works: Work[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Status, (status) => status.series, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'status_id' })
  status: Status;

  @ManyToOne(() => Franchise, (franchise) => franchise.series, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'franchise_id' })
  franchise: Franchise | null;
}
