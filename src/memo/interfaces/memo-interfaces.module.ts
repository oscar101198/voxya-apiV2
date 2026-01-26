import { Module } from "@nestjs/common";
import { StorageModule } from "src/infrastructure/storage/storage.module";
import { UserTypeOrmModule } from "src/user/infrastructure/typeorm/user-typeorm.module";
import { MemoService } from "../application";
import { MemoTypeOrmModule } from "../infrastructure/typeorm/memo-typeorm.module";
import { MemoController } from "./controllers";

@Module({
  imports: [MemoTypeOrmModule, UserTypeOrmModule, StorageModule],
  controllers: [MemoController],
  providers: [MemoService],
  exports: [MemoService],
})
export class MemoInterfacesModule {}
