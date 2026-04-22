import { Illustrator } from 'src/illustrators/entities/illustrator.entity';
import { Work } from './work.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('work_illustrators')
export class WorkIllustrator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_id' })
  workId: string;

  @Column({ name: 'illustrator_id' })
  illustratorId: string;

  @ManyToOne(() => Work, (work) => work.workIllustrators, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @ManyToOne(() => Illustrator, (illustrator) => illustrator.workIllustrators, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'illustrator_id' })
  illustrator: Illustrator;
}
