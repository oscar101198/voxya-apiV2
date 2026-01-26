import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantEntity } from "src/tenant/infrastructure/typeorm/entities";
import { UserEntity } from "./entities";
import { UserOrmRepository } from "./repositories";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TenantEntity]),
  ],
  providers: [UserOrmRepository],
  exports: [UserOrmRepository],
})
export class UserTypeOrmModule {}
