import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantEntity } from "src/tenant/infrastructure/typeorm/entities";
import { RefreshTokenEntity, UserEntity } from "./entities";
import { RefreshTokenOrmRepository, UserOrmRepository } from "./repositories";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TenantEntity, RefreshTokenEntity]),
  ],
  providers: [UserOrmRepository, RefreshTokenOrmRepository],
  exports: [UserOrmRepository, RefreshTokenOrmRepository],
})
export class UserTypeOrmModule {}
