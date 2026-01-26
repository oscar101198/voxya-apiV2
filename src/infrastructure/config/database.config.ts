import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const getDatabaseConfig = (
  configService: ConfigService
): TypeOrmModuleOptions => ({
  type: "postgres",
  host: configService.get("DB_HOST", "localhost"),
  port: configService.get("DB_PORT", 5432),
  username: configService.get("DB_USERNAME", "postgres"),
  password: configService.get("DB_PASSWORD", "password"),
  database: configService.get(
    "DB_NAME",
    configService.get("NODE_ENV") === "test" ? "voxya_test" : "voxya"
  ),
  entities: [
    __dirname +
      "/../../**/infrastructure/typeorm/entities/*.orm.entity{.ts,.js}",
  ],
  synchronize: configService.get("NODE_ENV") === "development",
  logging: configService.get("NODE_ENV") === "development",
  ssl:
    configService.get("DB_SSL") === "true"
      ? { rejectUnauthorized: false }
      : false,
  migrations: [__dirname + "/../database/migrations/*{.ts,.js}"],
  migrationsRun:
    configService.get("NODE_ENV") === "production" ||
    configService.get("NODE_ENV") === "test",
  migrationsTableName: "migrations",
});
