import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
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
import { GetAllUsersQuery } from "../dto";

@Controller("users")
@ApiTags("user")
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: User })
  async getAllUsers(
    @Query() query: GetAllUsersQuery,
    @GetAuthenticatedUser()
    { tenantId }: { tenantId: string }
  ): Promise<{
    data: User[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const offset = (page - 1) * limit;

      const [users, total] = await this.userService.getAllUsers(
        tenantId,
        limit,
        offset,
        query.search,
        query.sort,
        query.order
      );

      const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

      return {
        data: users,
        page,
        limit,
        total,
        totalPages,
      };
    } catch (error) {
      console.error("getAllUsers error", error);
      if (error instanceof HttpException) {
        throw error;
      }

      // Erreur générique
      throw new HttpException(
        "Erreur lors de la récupération des utilisateurs",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("count")
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK })
  async getUserCount(
    @GetAuthenticatedUser()
    { tenantId }: { tenantId: string }
  ): Promise<{ count: number }> {
    try {
      const count = await this.userService.getUserCount(tenantId);
      return { count };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Erreur générique
      throw new HttpException(
        "Erreur lors du comptage des utilisateurs",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
