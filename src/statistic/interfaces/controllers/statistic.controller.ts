import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  BearerAuth,
  GetAuthenticatedUser,
  Payload,
} from "src/default/default.decorators";
import { DefaultCodeEnum } from "src/default/default.enums";
import { StatisticService } from "../../application";
import { StatisticResponseDto } from "../dto";

@Controller("statistic")
@ApiTags("statistic")
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: StatisticResponseDto })
  async getStatistics(
    @GetAuthenticatedUser()
    { tenantId }: { tenantId: string }
  ): Promise<StatisticResponseDto> {
    try {
      return await this.statisticService.getStatistics(tenantId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Generic error
      throw new HttpException(
        "Erreur lors de la récupération des statistiques",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
