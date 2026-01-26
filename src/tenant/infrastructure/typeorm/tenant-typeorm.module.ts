import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantEntity } from "./entities/tenant.orm.entity";
import { TenantOrmRepository } from "./repositories/tenant.orm.repository";

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity])],
  providers: [TenantOrmRepository],
  exports: [TenantOrmRepository],
})
export class TenantTypeOrmModule {}
