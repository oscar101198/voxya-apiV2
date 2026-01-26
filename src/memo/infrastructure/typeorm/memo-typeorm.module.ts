import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "src/user/infrastructure/typeorm/entities";
import { MemoEntity } from "./entities";
import { MemoOrmRepository } from "./repositories";

@Module({
  imports: [TypeOrmModule.forFeature([MemoEntity, UserEntity])],
  providers: [MemoOrmRepository],
  exports: [MemoOrmRepository],
})
export class MemoTypeOrmModule {}
