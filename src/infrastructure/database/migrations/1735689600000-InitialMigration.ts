import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1735689600000 implements MigrationInterface {
  name = "InitialMigration1735689600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create tenants table
    await queryRunner.query(
      `CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(100) NOT NULL,
        "name" character varying(255) NOT NULL,
        "domain" character varying(255),
        "settings" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "subscriptionExpiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "UQ_tenants_code" UNIQUE ("code"),
        CONSTRAINT "UQ_tenants_domain" UNIQUE ("domain"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )`
    );

    // Create index on tenants.code
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tenants_code" ON "tenants" ("code")`
    );

    // Create users table
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "first_name" character varying(100),
        "last_name" character varying(100),
        "phone_number" character varying(20),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "last_login" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "subscription_plan" character varying(50) NOT NULL DEFAULT 'free',
        "wildix_id" character varying(255),
        "tenant_id" uuid NOT NULL,
        "fcm_token" text,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`
    );

    // Create indexes on users table
    await queryRunner.query(
      `CREATE INDEX "IDX_users_tenant_id" ON "users" ("tenant_id")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`
    );

    // Create foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_tenant_id"`
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_tenant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_tenants_code"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
