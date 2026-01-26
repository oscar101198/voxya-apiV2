import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BearerAuth, Payload } from "src/default/default.decorators";
import { DefaultCodeEnum } from "src/default/default.enums";
import { TenantService } from "src/tenant/application";
import { TenantEntity } from "src/tenant/infrastructure/typeorm/entities";
import { GetTenantsQuery } from "../dto";

@Controller("tenants")
@ApiTags("tenant")
export class TenantsController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: TenantEntity })
  async getAllTenants(
    @Query() query: GetTenantsQuery
  ): Promise<{
    data: TenantEntity[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    try {
      const limit = query.limit || 25;
      const page = query.page || 1;
      const offset = (page - 1) * limit;

      const [tenants, total] = await this.tenantService.getAllTenants(
        limit,
        offset,
        query.search,
        query.sort,
        query.order
      );

      const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

      return {
        data: tenants,
        page,
        limit,
        total,
        totalPages,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Erreur lors de la récupération des tenants",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

