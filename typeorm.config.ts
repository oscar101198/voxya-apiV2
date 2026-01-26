import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";

const configService = new ConfigService();

export default new DataSource({
  type: "postgres",
  host: configService.get("DB_HOST", "localhost"),
  port: configService.get("DB_PORT", 5432),
  username: configService.get("DB_USERNAME", "postgres"),
  password: configService.get("DB_PASSWORD", "password"),
  database: configService.get("DB_NAME", "voxya"),
  entities: [
    __dirname + "/src/**/infrastructure/typeorm/entities/*.orm.entity{.ts,.js}",
  ],
  migrations: [
    __dirname + "/src/infrastructure/database/migrations/*{.ts,.js}",
  ],
  migrationsTableName: "migrations",
  synchronize: false, // Never use synchronize in production
  logging: configService.get("NODE_ENV") === "development",
});
