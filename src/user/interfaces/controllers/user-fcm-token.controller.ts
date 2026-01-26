import {
    Body,
    Controller,
    HttpException,
    HttpStatus,
    Post,
  } from "@nestjs/common";
  import { ApiTags } from "@nestjs/swagger";
  import {
    BearerAuth,
    GetAuthenticatedUser,
    Payload,
  } from "src/default/default.decorators";
  import { DefaultCodeEnum } from "src/default/default.enums";
  import { UserService } from "src/user/application";
  import { UserEntity as User } from "src/user/infrastructure/typeorm/entities";
  import { AuthenticatedUser } from "src/user/interfaces/authenticated-user.interface";
  import { RegisterFcmTokenInput } from "../dto";
  
  @Controller("user")
  @ApiTags("user")
  export class UserFcmTokenController {
    constructor(private readonly userService: UserService) {}
  
    @Post("fcm-token")
    @BearerAuth()
    @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: User })
    async registerFcmToken(
      @GetAuthenticatedUser()
      {
        user,
        tenantId,
      }: AuthenticatedUser & { tenantId: string },
      @Body() input: RegisterFcmTokenInput
    ): Promise<User> {
      try {
        return await this.userService.registerFcmToken(
          user.id,
          input,
          tenantId
        );
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
  
        // Erreur générique
        throw new HttpException(
          "Erreur lors de l'enregistrement du token FCM",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }