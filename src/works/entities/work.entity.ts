import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cover } from './cover.entity';
import { Media } from './media.entity';
import { Language } from 'src/languages/entities/language.entity';
import { Serie } from 'src/series/entities/serie.entity';
import { WorkAuthor } from './work-author.entity';
import { WorkIllustrator } from './work-illustrator.entity';

@Entity('works')
export class Work {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'varchar', nullable: true })
  subtitle: string | null;

  @Column({ type: 'int', nullable: true, unique: true })
  volume: number | null;

  @Column({ type: 'decimal', nullable: true })
  price: number | null;

  @Column({ name: 'media_id', nullable: true })
  mediaId: string | null;

  @Column({ name: 'language_id', type: 'varchar', nullable: true })
  languageId: string | null;

  @Column({ name: 'serie_id', type: 'varchar', nullable: true })
  serieId: string | null;

  @Column({ default: false, name: 'is_special_edition' })
  isSpecialEdition: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Cover, (cover) => cover.work)
  covers: Cover[];

  @ManyToOne(() => Media, (media) => media.works, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'media_id' })
  media: Media | null;

  @ManyToOne(() => Language, (language) => language.works, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'language_id' })
  language: Language | null;

  @OneToMany(() => WorkAuthor, (workAuthor) => workAuthor.work)
  workAuthors: WorkAuthor[];

  @OneToMany(() => WorkIllustrator, (workIllustrator) => workIllustrator.work)
  workIllustrators: WorkIllustrator[];

  @ManyToOne(() => Serie, (serie) => serie.works, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'serie_id' })
  serie: Serie | null;
}
