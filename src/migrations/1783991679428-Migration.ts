import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1783991679428 implements MigrationInterface {
    name = 'Migration1783991679428'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."medias_type_enum" RENAME TO "medias_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."medias_type_enum" AS ENUM('light_novel', 'webtoon', 'manga', 'book')`);
        await queryRunner.query(`ALTER TABLE "medias" ALTER COLUMN "type" TYPE "public"."medias_type_enum" USING "type"::"text"::"public"."medias_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."medias_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."medias_type_enum_old" AS ENUM('light_novel', 'manga', 'book')`);
        await queryRunner.query(`ALTER TABLE "medias" ALTER COLUMN "type" TYPE "public"."medias_type_enum_old" USING "type"::"text"::"public"."medias_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."medias_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."medias_type_enum_old" RENAME TO "medias_type_enum"`);
    }

}
