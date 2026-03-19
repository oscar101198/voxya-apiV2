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
import * as bcrypt from "bcryptjs";
import { DefaultCodeEnum } from "src/default/default.enums";
import { DatabaseModule } from "src/infrastructure/database/database.module";
import { UserEntity } from "src/user/infrastructure/typeorm/entities";
import { UserInterfacesModule } from "src/user/interfaces/user-interfaces.module";
import { Test as TestItem } from "supertest";
import TestAgent from "supertest/lib/agent";
import { DataSource, QueryRunner } from "typeorm";
import { TenantEntity } from "src/tenant/infrastructure/typeorm/entities";

const supertest = require("supertest");

describe("UserAuthController - login, refresh, logout (e2e)", () => {
  let app: INestApplication;
  let request: TestAgent<TestItem>;
  let queryRunner: QueryRunner;

  let tenant: TenantEntity;
  let user: UserEntity;

  const userPassword = "password123";
  const userEmail = "auth-refresh-test@example.com";

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [".env.test", ".env"],
        }),
        DatabaseModule,
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

    const dataSource = moduleFixture.get(DataSource);
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    tenant = await queryRunner.manager.getRepository(TenantEntity).save({
      code: "auth-refresh-tenant",
      name: "Auth Refresh Tenant",
      domain: "auth-refresh.com",
      isActive: true,
    });

    const hashedPassword = await bcrypt.hash(userPassword, 10);
    user = await queryRunner.manager.getRepository(UserEntity).save({
      email: userEmail,
      password: hashedPassword,
      tenantId: tenant.id,
      isActive: true,
    });

    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    if (queryRunner) {
      await queryRunner.manager.query(
        `TRUNCATE TABLE refresh_tokens, users, tenants RESTART IDENTITY CASCADE`
      );
      await queryRunner.release();
    }
    if (app) await app.close();
  });

  describe("POST /user/auth", () => {
    it("should return 404 when user not found", async () => {
      const res = await request.post("/user/auth").send({
        email: "nonexistent@example.com",
        password: userPassword,
      });
      expect(res.status).toBe(DefaultCodeEnum.NOT_FOUND);
    });

    it("should return 404 when credentials are wrong", async () => {
      const res = await request.post("/user/auth").send({
        email: userEmail,
        password: "wrongpassword",
      });
      expect(res.status).toBe(DefaultCodeEnum.NOT_FOUND);
    });

    it("should return 200 with accessToken and refreshToken on success", async () => {
      const res = await request.post("/user/auth").send({
        email: userEmail,
        password: userPassword,
      });
      expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body).toHaveProperty("user");
      expect(typeof res.body.accessToken).toBe("string");
      expect(typeof res.body.refreshToken).toBe("string");
      expect(res.body.user.id).toBe(user.id);
    });
  });

  describe("POST /user/refresh", () => {
    it("should return 401 for invalid refresh token", async () => {
      const res = await request.post("/user/refresh").send({
        refreshToken: "invalid-token",
      });
      expect(res.status).toBe(DefaultCodeEnum.UNAUTHORIZED);
    });

    it("should return 200 with new accessToken and refreshToken when valid", async () => {
      const loginRes = await request.post("/user/auth").send({
        email: userEmail,
        password: userPassword,
      });
      expect(loginRes.status).toBe(DefaultCodeEnum.SUCCESS_OK);
      const refreshToken = loginRes.body.refreshToken;

      const res = await request.post("/user/refresh").send({
        refreshToken,
      });
      expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(typeof res.body.accessToken).toBe("string");
      expect(typeof res.body.refreshToken).toBe("string");
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });
  });

  describe("POST /user/logout", () => {
    it("should return 204 and revoke the refresh token", async () => {
      const loginRes = await request.post("/user/auth").send({
        email: userEmail,
        password: userPassword,
      });
      const refreshToken = loginRes.body.refreshToken;

      const logoutRes = await request.post("/user/logout").send({
        refreshToken,
      });
      expect(logoutRes.status).toBe(204);

      const refreshRes = await request.post("/user/refresh").send({
        refreshToken,
      });
      expect(refreshRes.status).toBe(DefaultCodeEnum.UNAUTHORIZED);
    });
  });
});
