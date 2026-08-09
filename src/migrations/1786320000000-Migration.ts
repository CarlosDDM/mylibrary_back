import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1786320000000 implements MigrationInterface {
  name = 'Migration1786320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
    await queryRunner.query(
      `DROP TEXT SEARCH CONFIGURATION IF EXISTS public.simple_unaccent CASCADE`,
    );
    await queryRunner.query(
      `CREATE TEXT SEARCH CONFIGURATION public.simple_unaccent (COPY = pg_catalog.simple)`,
    );
    await queryRunner.query(
      `ALTER TEXT SEARCH CONFIGURATION public.simple_unaccent
       ALTER MAPPING FOR asciiword, word, numword, asciihword, hword, hword_part, hword_asciipart, hword_numpart, numhword
       WITH unaccent, simple`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_works_search" ON "works" USING GIN (to_tsvector('public.simple_unaccent', coalesce("name", '') || ' ' || coalesce("subtitle", '')))`,
    );
    for (const table of [
      'series',
      'authors',
      'franchises',
      'illustrators',
      'users',
    ]) {
      await queryRunner.query(
        `CREATE INDEX "IDX_${table}_search" ON "${table}" USING GIN (to_tsvector('public.simple_unaccent', coalesce("name", '')))`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'users',
      'illustrators',
      'franchises',
      'authors',
      'series',
    ]) {
      await queryRunner.query(`DROP INDEX "IDX_${table}_search"`);
    }
    await queryRunner.query(`DROP INDEX "IDX_works_search"`);
    await queryRunner.query(
      `DROP TEXT SEARCH CONFIGURATION public.simple_unaccent`,
    );
  }
}
