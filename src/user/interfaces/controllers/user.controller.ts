import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Query,
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
import { CreateUserInput, GetUserQuery, UpdateUserInput } from "../dto";

@Controller("user")
@ApiTags("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: User })
  async createUser(
    @Body() input: CreateUserInput,
    @GetAuthenticatedUser()
    { tenantId }: { tenantId: string }
  ): Promise<User> {
    try {
      return await this.userService.createUser(input, tenantId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Erreur générique
      throw new HttpException(
        "Erreur lors de la création de l'utilisateur",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: User })
  async getUserById(
    @Query() query: GetUserQuery,
    @GetAuthenticatedUser()
    { tenantId }: { tenantId: string }
  ): Promise<User> {
    try {
      const user = await this.userService.getUserById(query.id, tenantId);
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Si c'est une erreur de "not found" du service
      if (error.message?.includes("not found")) {
        throw new HttpException(
          `Utilisateur avec l'ID ${query.id} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      // Erreur générique
      throw new HttpException(
        "Erreur interne du serveur",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: User })
  async updateUser(
    @Query() query: GetUserQuery,
    @Body() input: UpdateUserInput,
    @GetAuthenticatedUser()
    { tenantId }: { tenantId: string }
  ): Promise<User> {
    try {
      const user = await this.userService.updateUser(query.id, input, tenantId);
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Erreur générique
      throw new HttpException(
        "Erreur lors de la mise à jour de l'utilisateur",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK })
  async deleteUser(
    @Query() query: GetUserQuery,
    @GetAuthenticatedUser()
    { tenantId }: { tenantId: string }
  ): Promise<{ message: string }> {
    try {
      const deleted = await this.userService.deleteUser(query.id, tenantId);
      if (!deleted) {
        throw new HttpException(
          "Erreur lors de la suppression de l'utilisateur",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return { message: "Utilisateur supprimé avec succès" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Erreur générique
      throw new HttpException(
        "Erreur lors de la suppression de l'utilisateur",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
