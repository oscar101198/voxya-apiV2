import { Module } from "@nestjs/common";
import { UserInterfacesModule } from "src/user/interfaces/user-interfaces.module";
import { StatisticService } from "../application";
import { StatisticController } from "./controllers/statistic.controller";

@Module({
  imports: [UserInterfacesModule],
  controllers: [StatisticController],
  providers: [StatisticService],
})
export class StatisticInterfacesModule {}
