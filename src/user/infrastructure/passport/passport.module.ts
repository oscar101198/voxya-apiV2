import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { UserTypeOrmModule } from "../typeorm/user-typeorm.module";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [PassportModule, UserTypeOrmModule],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class UserPassportModule {}
