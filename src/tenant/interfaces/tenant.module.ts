import { Module } from "@nestjs/common";
import { TenantService } from "../application";
import { TenantTypeOrmModule } from "../infrastructure/typeorm/tenant-typeorm.module";
import { TenantController, TenantsController } from "./controllers";

@Module({
  imports: [TenantTypeOrmModule],
  controllers: [TenantController, TenantsController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}

