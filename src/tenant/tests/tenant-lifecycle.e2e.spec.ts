import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { randomUUID } from "crypto";
import { generateAuthToken } from "src/_utils";
import { DefaultCodeEnum } from "src/default/default.enums";
import { DatabaseModule } from "src/infrastructure/database/database.module";
import { UserEntity } from "src/user/infrastructure/typeorm/entities";
import { UserInterfacesModule } from "src/user/interfaces/user-interfaces.module";
import { Test as TestItem } from "supertest";
import TestAgent from "supertest/lib/agent";
import { DataSource, QueryRunner } from "typeorm";
import { TenantModule } from "../interfaces";

const supertest = require("supertest");

describe("TenantController - Lifecycle (e2e)", () => {
  let app: INestApplication;
  let request: TestAgent<TestItem>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  let userAdmin: UserEntity;
  let createdTenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [".env.test"],
        }),
        DatabaseModule,
        TenantModule,
        UserInterfacesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    dataSource = moduleFixture.get(DataSource);

    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Create test user
    userAdmin = await queryRunner.manager.getRepository(UserEntity).save({
      username: "admintest@voxya.com",
      password: "admin123",
    });

    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await queryRunner.manager.query(
      `TRUNCATE TABLE tenants, users RESTART IDENTITY CASCADE;`
    );
    await queryRunner.release();
    await app.close();
  });

  describe("POST /tenant - Create", () => {
    it("should return an error (unauthorized - no token)", async () => {
      return request
        .post("/tenant")
        .send({
          code: "test-tenant",
          name: "Test Tenant",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.UNAUTHORIZED);
        });
    });

    it("should create a new tenant with minimal data", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "test-tenant-minimal",
          name: "Test Tenant Minimal",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body).toHaveProperty("id");
          expect(res.body.code).toBe("test-tenant-minimal");
          expect(res.body.name).toBe("Test Tenant Minimal");
          expect(res.body.isActive).toBe(true); // default value
          expect(res.body.domain).toBeNull();
        });
    });

    it("should create a new tenant with all fields", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });
      const subscriptionDate = new Date();
      subscriptionDate.setFullYear(subscriptionDate.getFullYear() + 1);

      return request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "test-tenant-full",
          name: "Test Tenant Full",
          domain: "test-tenant-full.com",
          settings: { theme: "dark", language: "fr" },
          isActive: true,
          subscriptionExpiresAt: subscriptionDate.toISOString(),
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body).toHaveProperty("id");
          expect(res.body.code).toBe("test-tenant-full");
          expect(res.body.name).toBe("Test Tenant Full");
          expect(res.body.domain).toBe("test-tenant-full.com");
          expect(res.body.isActive).toBe(true);
          expect(res.body.settings).toEqual({ theme: "dark", language: "fr" });
          expect(res.body).toHaveProperty("subscriptionExpiresAt");
          createdTenantId = res.body.id;
        });
    });

    it("should return error when creating tenant with duplicate code", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      // First create
      await request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "duplicate-code",
          name: "First Tenant",
        });

      // Try to create with same code
      return request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "duplicate-code",
          name: "Second Tenant",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.CONFLICT_1);
        });
    });

    it("should return error when creating tenant with duplicate domain", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      // First create
      await request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "tenant-with-domain-1",
          name: "First Tenant",
          domain: "duplicate-domain.com",
        });

      // Try to create with same domain
      return request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "tenant-with-domain-2",
          name: "Second Tenant",
          domain: "duplicate-domain.com",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.CONFLICT_1);
        });
    });

    it("should return error when code is too short", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "a",
          name: "Test Tenant",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.BAD_REQUEST);
        });
    });

    it("should return error when name is missing", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "test-tenant-no-name",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.BAD_REQUEST);
        });
    });
  });

  describe("PUT /tenant - Update", () => {
    let updateTenantId: string;

    beforeAll(async () => {
      // Create a tenant for update tests
      const token = generateAuthToken({ userID: userAdmin.id });
      const response = await request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "tenant-to-update",
          name: "Tenant To Update",
          domain: "tenant-to-update.com",
        });
      updateTenantId = response.body.id;
    });

    it("should return an error (unauthorized - no token)", async () => {
      return request
        .put(`/tenant?id=${updateTenantId}`)
        .send({
          name: "Updated Name",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.UNAUTHORIZED);
        });
    });

    it("should update tenant name", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .put(`/tenant?id=${updateTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Tenant Name",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.id).toBe(updateTenantId);
          expect(res.body.name).toBe("Updated Tenant Name");
          expect(res.body.code).toBe("tenant-to-update"); // unchanged
        });
    });

    it("should update tenant domain", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .put(`/tenant?id=${updateTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          domain: "new-domain.com",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.domain).toBe("new-domain.com");
        });
    });

    it("should update tenant settings", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .put(`/tenant?id=${updateTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          settings: { theme: "light", language: "en", feature: "enabled" },
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.settings).toEqual({
            theme: "light",
            language: "en",
            feature: "enabled",
          });
        });
    });

    it("should update tenant isActive status", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .put(`/tenant?id=${updateTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          isActive: false,
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.isActive).toBe(false);
        });
    });

    it("should update multiple fields at once", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });
      const subscriptionDate = new Date();
      subscriptionDate.setFullYear(subscriptionDate.getFullYear() + 2);

      return request
        .put(`/tenant?id=${updateTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Fully Updated Tenant",
          domain: "fully-updated.com",
          isActive: true,
          subscriptionExpiresAt: subscriptionDate.toISOString(),
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.name).toBe("Fully Updated Tenant");
          expect(res.body.domain).toBe("fully-updated.com");
          expect(res.body.isActive).toBe(true);
          expect(res.body).toHaveProperty("subscriptionExpiresAt");
        });
    });

    it("should return error when updating with duplicate code", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      // Create another tenant
      const response = await request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "another-tenant",
          name: "Another Tenant",
        });
      const anotherTenantId = response.body.id;

      // Try to update with duplicate code
      return request
        .put(`/tenant?id=${updateTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "another-tenant",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.CONFLICT_1);
        });
    });

    it("should return 404 for non-existent tenant", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });
      const fakeId = randomUUID();

      return request
        .put(`/tenant?id=${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Name",
        })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.NOT_FOUND);
        });
    });
  });

  describe("DELETE /tenant - Delete", () => {
    let deleteTenantId: string;

    beforeEach(async () => {
      // Create a tenant for each delete test
      const token = generateAuthToken({ userID: userAdmin.id });
      const response = await request
        .post("/tenant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: `tenant-to-delete-${Date.now()}`,
          name: "Tenant To Delete",
        });
      deleteTenantId = response.body.id;
    });

    it("should return an error (unauthorized - no token)", async () => {
      return request
        .delete(`/tenant?id=${deleteTenantId}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.UNAUTHORIZED);
        });
    });

    it("should soft delete a tenant", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .delete(`/tenant?id=${deleteTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain(deleteTenantId);
        });
    });

    it("should not return deleted tenant in GET /tenants", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      // Delete the tenant
      await request
        .delete(`/tenant?id=${deleteTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send();

      // Try to get it
      return request
        .get(`/tenant?id=${deleteTenantId}`)
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.NOT_FOUND);
        });
    });

    it("should return 404 when deleting non-existent tenant", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });
      const fakeId = randomUUID();

      return request
        .delete(`/tenant?id=${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.NOT_FOUND);
        });
    });
  });
});
