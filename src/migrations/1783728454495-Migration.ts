import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1783728454495 implements MigrationInterface {
    name = 'Migration1783728454495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "covers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "is_special_edition" boolean NOT NULL DEFAULT false, "cover_order" integer NOT NULL, "work_id" uuid NOT NULL, CONSTRAINT "PK_99b1572dfa31a647e087269734c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."languages_type_enum" AS ENUM('pt-br', 'en')`);
        await queryRunner.query(`CREATE TABLE "languages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."languages_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_482fc82e456d6fd2058c40702de" UNIQUE ("type"), CONSTRAINT "PK_b517f827ca496b29f4d549c631d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."status_type_enum" AS ENUM('ongoing', 'completed', 'hiatus', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "status" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."status_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_93576f0b9e25968e27487a5f63b" UNIQUE ("type"), CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "franchises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5ff74e1ad0637c499c4ed139e2c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "series" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "status_id" uuid NOT NULL, "franchise_id" uuid, "serie_volumes" integer, "cover_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_68b808a9039892c61219f868f2a" UNIQUE ("name"), CONSTRAINT "PK_e725676647382eb54540d7128ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "authors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d2ed02fabd9b52847ccb85e6b88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "work_authors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "work_id" uuid NOT NULL, "author_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d2b283cecc1a1d2353cdd2ec22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "illustrators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a57163628dd89135e686eade89f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "work_illustrators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "work_id" uuid NOT NULL, "illustrator_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a663c5815fda0318c3c07a828fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."medias_type_enum" AS ENUM('light_novel', 'manga', 'book')`);
        await queryRunner.query(`CREATE TABLE "medias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."medias_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a8c6f1a5c60000be9de538fe61d" UNIQUE ("type"), CONSTRAINT "PK_f27321557a66cd4fae9bc1ed6e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "works" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "subtitle" character varying, "volume" integer, "volume_name" character varying, "price" numeric, "media_id" uuid, "language_id" uuid, "serie_id" uuid, "is_special_edition" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a9ffbf516ba6e52604b29e5cce0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_work_serie_volume_name" ON "works" ("serie_id", "volume_name") WHERE "volume_name" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_work_serie_volume" ON "works" ("serie_id", "volume", "is_special_edition") WHERE "volume" IS NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100), "username" character varying(100) NOT NULL, "email" character varying, "hashed_password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "covers" ADD CONSTRAINT "FK_c92fbce60be9581027fc35ecd92" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "series" ADD CONSTRAINT "FK_0f25b016c80669d3ed31b229abf" FOREIGN KEY ("status_id") REFERENCES "status"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "series" ADD CONSTRAINT "FK_8acbb092d26bca4a504a86ea3aa" FOREIGN KEY ("franchise_id") REFERENCES "franchises"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "work_authors" ADD CONSTRAINT "FK_79752850d5fdd0968373d599f8a" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "work_authors" ADD CONSTRAINT "FK_6ccf54abf10679eec05f03d0381" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "work_illustrators" ADD CONSTRAINT "FK_11bf3384223b4f2d24e36a9bfaa" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "work_illustrators" ADD CONSTRAINT "FK_cec9610565ca595a3d909d35836" FOREIGN KEY ("illustrator_id") REFERENCES "illustrators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "works" ADD CONSTRAINT "FK_2d218a721fe6b530c0f150ce145" FOREIGN KEY ("media_id") REFERENCES "medias"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "works" ADD CONSTRAINT "FK_ad56e16b770a7c33840e571f40b" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "works" ADD CONSTRAINT "FK_8894617333b0df3d30321c852aa" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "works" DROP CONSTRAINT "FK_8894617333b0df3d30321c852aa"`);
        await queryRunner.query(`ALTER TABLE "works" DROP CONSTRAINT "FK_ad56e16b770a7c33840e571f40b"`);
        await queryRunner.query(`ALTER TABLE "works" DROP CONSTRAINT "FK_2d218a721fe6b530c0f150ce145"`);
        await queryRunner.query(`ALTER TABLE "work_illustrators" DROP CONSTRAINT "FK_cec9610565ca595a3d909d35836"`);
        await queryRunner.query(`ALTER TABLE "work_illustrators" DROP CONSTRAINT "FK_11bf3384223b4f2d24e36a9bfaa"`);
        await queryRunner.query(`ALTER TABLE "work_authors" DROP CONSTRAINT "FK_6ccf54abf10679eec05f03d0381"`);
        await queryRunner.query(`ALTER TABLE "work_authors" DROP CONSTRAINT "FK_79752850d5fdd0968373d599f8a"`);
        await queryRunner.query(`ALTER TABLE "series" DROP CONSTRAINT "FK_8acbb092d26bca4a504a86ea3aa"`);
        await queryRunner.query(`ALTER TABLE "series" DROP CONSTRAINT "FK_0f25b016c80669d3ed31b229abf"`);
        await queryRunner.query(`ALTER TABLE "covers" DROP CONSTRAINT "FK_c92fbce60be9581027fc35ecd92"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_work_serie_volume"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_work_serie_volume_name"`);
        await queryRunner.query(`DROP TABLE "works"`);
        await queryRunner.query(`DROP TABLE "medias"`);
        await queryRunner.query(`DROP TYPE "public"."medias_type_enum"`);
        await queryRunner.query(`DROP TABLE "work_illustrators"`);
        await queryRunner.query(`DROP TABLE "illustrators"`);
        await queryRunner.query(`DROP TABLE "work_authors"`);
        await queryRunner.query(`DROP TABLE "authors"`);
        await queryRunner.query(`DROP TABLE "series"`);
        await queryRunner.query(`DROP TABLE "franchises"`);
        await queryRunner.query(`DROP TABLE "status"`);
        await queryRunner.query(`DROP TYPE "public"."status_type_enum"`);
        await queryRunner.query(`DROP TABLE "languages"`);
        await queryRunner.query(`DROP TYPE "public"."languages_type_enum"`);
        await queryRunner.query(`DROP TABLE "covers"`);
    }

}
