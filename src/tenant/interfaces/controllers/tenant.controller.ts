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
import { BearerAuth, Payload } from "src/default/default.decorators";
import { DefaultCodeEnum } from "src/default/default.enums";
import { TenantService } from "src/tenant/application";
import { TenantEntity } from "src/tenant/infrastructure/typeorm/entities";
import {
  CreateTenantInput,
  GetTenantQuery,
  UpdateTenantInput,
} from "../dto";

@Controller("tenant")
@ApiTags("tenant")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: TenantEntity })
  async createTenant(@Body() input: CreateTenantInput): Promise<TenantEntity> {
    try {
      return await this.tenantService.createTenant({
        code: input.code,
        name: input.name,
        domain: input.domain,
        settings: input.settings,
        isActive: input.isActive,
        subscriptionExpiresAt: input.subscriptionExpiresAt
          ? new Date(input.subscriptionExpiresAt)
          : undefined,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Erreur lors de la création du tenant",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: TenantEntity })
  async getTenantById(@Query() query: GetTenantQuery): Promise<TenantEntity> {
    try {
      return await this.tenantService.getTenantById(query.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.message?.includes("not found")) {
        throw new HttpException(
          `Tenant avec l'ID ${query.id} non trouvé`,
          HttpStatus.NOT_FOUND
        );
      }

      throw new HttpException(
        "Erreur interne du serveur",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: TenantEntity })
  async updateTenant(
    @Query() query: GetTenantQuery,
    @Body() input: UpdateTenantInput
  ): Promise<TenantEntity> {
    try {
      return await this.tenantService.updateTenant(query.id, {
        code: input.code,
        name: input.name,
        domain: input.domain,
        settings: input.settings,
        isActive: input.isActive,
        subscriptionExpiresAt: input.subscriptionExpiresAt
          ? new Date(input.subscriptionExpiresAt)
          : undefined,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Erreur lors de la mise à jour du tenant",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: TenantEntity })
  async deleteTenant(
    @Query() query: GetTenantQuery
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.tenantService.deleteTenant(query.id);
      return {
        success: true,
        message: `Tenant avec l'ID ${query.id} supprimé avec succès`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Erreur lors de la suppression du tenant",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

