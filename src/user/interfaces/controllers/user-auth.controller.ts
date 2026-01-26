import { Body, Controller, NotFoundException, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { Payload } from "src/default/default.decorators";
import { DefaultCodeEnum } from "src/default/default.enums";
import { UserService } from "src/user/application";
import { UserEntity } from "src/user/infrastructure/typeorm/entities";
import { UserAuthInput, UserAuthOutput } from "../dto";

@Controller()
@ApiTags("user")
export class UserAuthController {
  constructor(private userService: UserService) {}

  @Post("user/auth")
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: UserAuthOutput })
  async authUser(@Body() input: UserAuthInput): Promise<UserAuthOutput> {
    const user = await this.userService.findByEmailForAuth(input.email);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.isActive) {
      throw new NotFoundException("User is not active");
    }

    const result = this.userService.auth({ user, password: input.password });

    if (!result.accessToken) {
      throw new NotFoundException("Wrong credentials");
    }

    // Update last login
    await this.userService.updateLastLogin(user.id);

    return {
      user: plainToInstance(UserEntity, user),
      accessToken: result.accessToken,
    };
  }
}
