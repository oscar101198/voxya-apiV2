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
import { generateAuthToken } from "src/_utils";
import { DefaultCodeEnum } from "src/default/default.enums";
import { DatabaseModule } from "src/infrastructure/database/database.module";
import { UserEntity } from "src/user/infrastructure/typeorm/entities";
import { UserInterfacesModule } from "src/user/interfaces/user-interfaces.module";
import { Test as TestItem } from "supertest";
import TestAgent from "supertest/lib/agent";
import { DataSource, QueryRunner } from "typeorm";
import { TenantEntity } from "src/tenant/infrastructure/typeorm/entities";
import { CallInterfacesModule } from "../interfaces/call-interfaces.module";
import { CallService } from "../application";

const supertest = require("supertest");

describe("CallController - POST /call (e2e)", () => {
  let app: INestApplication;
  let request: TestAgent<TestItem>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  let userWithWildix: UserEntity;
  let userWithoutWildix: UserEntity;
  let tenant: TenantEntity;

  const mockCallService = {
    makeCall: jest.fn().mockResolvedValue({ ok: true }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [".env.test", ".env"],
        }),
        DatabaseModule,
        UserInterfacesModule,
        CallInterfacesModule,
      ],
    })
      .overrideProvider(CallService)
      .useValue(mockCallService)
      .compile();

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

    tenant = await queryRunner.manager.getRepository(TenantEntity).save({
      code: "call-test-tenant",
      name: "Call Test Tenant",
      domain: "calltest.com",
      isActive: true,
    });

    const hashedPassword = await bcrypt.hash("password123", 10);

    userWithWildix = await queryRunner.manager.getRepository(UserEntity).save({
      email: "with-wildix@calltest.com",
      password: hashedPassword,
      tenantId: tenant.id,
      isActive: true,
      wildixId: "wildix_user_123",
    });

    userWithoutWildix = await queryRunner.manager
      .getRepository(UserEntity)
      .save({
        email: "without-wildix@calltest.com",
        password: hashedPassword,
        tenantId: tenant.id,
        isActive: true,
        wildixId: undefined,
      });

    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    if (queryRunner) {
      await queryRunner.manager.query(
        `TRUNCATE TABLE tenants, users RESTART IDENTITY CASCADE;`
      );
      await queryRunner.release();
    }
    if (app) await app.close();
  });

  describe("POST /call", () => {
    it("should return 401 Unauthorized when no token is provided", async () => {
      return request
        .post("/call")
        .send()
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.UNAUTHORIZED);
        });
    });

    it("should return 400 Bad Request when user has no wildixId", async () => {
      const token = generateAuthToken({ userID: userWithoutWildix.id });

      return request
        .post("/call")
        .set("Authorization", `Bearer ${token}`)
        .send({ dest_number: "+33612345678" })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.BAD_REQUEST);
        });
    });

    it("should return 200 and call Wildix when user has wildixId", async () => {
      const token = generateAuthToken({ userID: userWithWildix.id });
      const destNumber = "+33612345678";

      return request
        .post("/call")
        .set("Authorization", `Bearer ${token}`)
        .send({ dest_number: destNumber })
        .then((res) => {
          expect(res.status).toBe(DefaultCodeEnum.SUCCESS_OK);
          expect(mockCallService.makeCall).toHaveBeenCalledWith(
            userWithWildix.wildixId,
            destNumber
          );
        });
    });
  });
});
