import { Module } from "@nestjs/common";
import { UserService } from "../application";
import { UserPassportModule } from "../infrastructure/passport";
import { UserTypeOrmModule } from "../infrastructure/typeorm/user-typeorm.module";
import {
  UserAuthController,
  UserController,
  UsersController,
} from "./controllers";

@Module({
  imports: [UserTypeOrmModule, UserPassportModule],
  controllers: [UserAuthController, UserController, UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UserInterfacesModule {}
