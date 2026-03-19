import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshTokensTable1769461500000 implements MigrationInterface {
  name = "CreateRefreshTokensTable1769461500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user_id"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refresh_tokens_user_id"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refresh_tokens_token_hash"`
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
