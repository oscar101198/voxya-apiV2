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
import { TenantEntity } from "../infrastructure/typeorm/entities";
import { TenantModule } from "../interfaces";

const supertest = require("supertest");

describe("TenantsController - GET (e2e)", () => {
  let app: INestApplication;
  let request: TestAgent<TestItem>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  let userAdmin: UserEntity;

  let tenant1: TenantEntity;
  let tenant2: TenantEntity;
  let tenant3: TenantEntity;
  let tenant4: TenantEntity;
  let tenant5: TenantEntity;

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

    // Create test tenants
    tenant1 = await queryRunner.manager.getRepository(TenantEntity).save({
      code: "tenant-1",
      name: "Tenant 1",
      domain: "tenant1.com",
      isActive: true,
    });

    tenant2 = await queryRunner.manager.getRepository(TenantEntity).save({
      code: "tenant-2",
      name: "Tenant 2",
      domain: "tenant2.com",
      isActive: true,
    });

    tenant3 = await queryRunner.manager.getRepository(TenantEntity).save({
      code: "tenant-3",
      name: "Tenant 3",
      domain: "tenant3.com",
      isActive: false,
    });

    tenant4 = await queryRunner.manager.getRepository(TenantEntity).save({
      code: "tenant-4",
      name: "ACME Corporation",
      domain: "acme.com",
      isActive: true,
    });

    tenant5 = await queryRunner.manager.getRepository(TenantEntity).save({
      code: "tenant-5",
      name: "Test Company",
      isActive: true,
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

  describe("GET /tenants", () => {
    it("should return an error (unauthorized - no token)", async () => {
      return request
        .get("/tenants")
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.UNAUTHORIZED);
        });
    });

    it("should return all tenants", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get("/tenants")
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBeGreaterThanOrEqual(5);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(25);
          expect(res.body.total).toBeGreaterThanOrEqual(5);
          expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
        });
    });

    it("should return paginated tenants", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get("/tenants?page=1&limit=2")
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.data.length).toBeLessThanOrEqual(2);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(2);
          expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
        });
    });

    it("should return tenants with search filter (by name)", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get("/tenants?search=ACME")
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.data).toBeInstanceOf(Array);
          if (res.body.data.length > 0) {
            expect(
              res.body.data.some((t: TenantEntity) => t.name.includes("ACME"))
            ).toBe(true);
          }
        });
    });

    it("should return tenants with search filter (by code)", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get("/tenants?search=tenant-1")
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.data).toBeInstanceOf(Array);
          if (res.body.data.length > 0) {
            expect(
              res.body.data.some((t: TenantEntity) =>
                t.code.includes("tenant-1")
              )
            ).toBe(true);
          }
        });
    });

    it("should return tenants with search filter (by domain)", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get("/tenants?search=acme.com")
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.data).toBeInstanceOf(Array);
          if (res.body.data.length > 0) {
            expect(
              res.body.data.some((t: TenantEntity) =>
                t.domain?.includes("acme.com")
              )
            ).toBe(true);
          }
        });
    });

    it("should return tenants sorted by name ascending", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get("/tenants?sort=name&order=asc")
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.data).toBeInstanceOf(Array);
          if (res.body.data.length > 1) {
            const names = res.body.data.map((t: TenantEntity) => t.name);
            const sortedNames = [...names].sort();
            expect(names).toEqual(sortedNames);
          }
        });
    });

    it("should return tenants sorted by createdAt descending", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get("/tenants?sort=createdAt&order=desc")
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.data).toBeInstanceOf(Array);
          if (res.body.data.length > 1) {
            const dates = res.body.data.map((t: TenantEntity) =>
              new Date(t.createdAt).getTime()
            );
            const sortedDates = [...dates].sort((a, b) => b - a);
            expect(dates).toEqual(sortedDates);
          }
        });
    });
  });

  describe("GET /tenant", () => {
    it("should return an error (unauthorized - no token)", async () => {
      return request
        .get(`/tenant?id=${tenant1.id}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.UNAUTHORIZED);
        });
    });

    it("should return a tenant by ID", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get(`/tenant?id=${tenant1.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body).toHaveProperty("id");
          expect(res.body.id).toBe(tenant1.id);
          expect(res.body.code).toBe(tenant1.code);
          expect(res.body.name).toBe(tenant1.name);
          expect(res.body.domain).toBe(tenant1.domain);
          expect(res.body.isActive).toBe(tenant1.isActive);
        });
    });

    it("should return 404 for non-existent tenant", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });
      // Use a valid UUID v4 that doesn't exist in the database
      const fakeId = randomUUID();

      return request
        .get(`/tenant?id=${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.NOT_FOUND);
        });
    });

    it("should return tenant with all properties", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get(`/tenant?id=${tenant2.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("code");
          expect(res.body).toHaveProperty("name");
          expect(res.body).toHaveProperty("domain");
          expect(res.body).toHaveProperty("isActive");
          expect(res.body).toHaveProperty("createdAt");
          expect(res.body).toHaveProperty("updatedAt");
        });
    });

    it("should return tenant without domain (optional field)", async () => {
      const token = generateAuthToken({ userID: userAdmin.id });

      return request
        .get(`/tenant?id=${tenant5.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(res.body.id).toBe(tenant5.id);
          expect(res.body.code).toBe(tenant5.code);
          // domain can be undefined
          expect(
            res.body.domain === undefined || res.body.domain === null
          ).toBe(true);
        });
    });
  });
});
