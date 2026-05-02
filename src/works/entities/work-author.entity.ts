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
import { Author } from 'src/authors/entities/author.entity';

@Entity('work_authors')
export class WorkAuthor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_id' })
  workId: string;

  @Column({ name: 'author_id' })
  authorId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Work, (work) => work.workAuthors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @ManyToOne(() => Author, (author) => author.workAuthors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id' })
  author: Author;
}
