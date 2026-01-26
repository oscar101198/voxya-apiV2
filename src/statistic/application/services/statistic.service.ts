import { Injectable } from "@nestjs/common";
import { StatisticResponseDto } from "src/statistic/interfaces";
import { UserService } from "src/user/application";

@Injectable()
export class StatisticService {
  constructor(private readonly userService: UserService) {}

  async getStatistics(tenantId: string): Promise<StatisticResponseDto> {
    const totalUsers = await this.userService.getUserCount(tenantId);

    return {
      totalUsers,
    };
  }
}
