import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { FirebaseModule } from "./infrastructure/firebase";
import { CallInterfacesModule } from "./call/interfaces/call-interfaces.module";
import { MemoInterfacesModule } from "./memo/interfaces/memo-interfaces.module";
import { StatisticInterfacesModule } from "./statistic/interfaces/statistic-interfaces.module";
import { TenantModule } from "./tenant/interfaces";
import { UserInterfacesModule } from "./user/interfaces/user-interfaces.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["env", ".env", ".env.local"],
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6380", 10),
        maxRetriesPerRequest: null, // Disable retry limit for long-running jobs
        enableReadyCheck: false, // Disable ready check
        retryStrategy: (times) => {
          // Retry connection with exponential backoff
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      },
    }),
    DatabaseModule,
    FirebaseModule,
    UserInterfacesModule,
    TenantModule,
    CallInterfacesModule,
    StatisticInterfacesModule,
    MemoInterfacesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
