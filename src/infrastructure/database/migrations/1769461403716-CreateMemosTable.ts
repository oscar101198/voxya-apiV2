import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMemosTable1769461403716 implements MigrationInterface {
    name = 'CreateMemosTable1769461403716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "memos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "audio_url" character varying(500) NOT NULL, "audio_key" character varying(500) NOT NULL, "file_name" character varying(255) NOT NULL, "file_size" integer NOT NULL, "mime_type" character varying(100) NOT NULL, "duration" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_5f005ade603ff6ea114dcacde0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9f79ffe3b9c3882fc50dce7257" ON "memos" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_02a58f5ea347fd252734336bb2" ON "memos" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "memos" ADD CONSTRAINT "FK_memos_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memos" DROP CONSTRAINT "FK_memos_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02a58f5ea347fd252734336bb2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f79ffe3b9c3882fc50dce7257"`);
        await queryRunner.query(`DROP TABLE "memos"`);
    }

}
