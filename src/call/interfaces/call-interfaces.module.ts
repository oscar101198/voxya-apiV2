import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { CallService } from "../application";
import { CallController } from "./controllers";

@Module({
  imports: [HttpModule.register({})],
  controllers: [CallController],
  providers: [CallService],
  exports: [CallService],
})
export class CallInterfacesModule {}
