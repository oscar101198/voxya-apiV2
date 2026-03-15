import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  BearerAuth,
  GetAuthenticatedUser,
  Payload,
} from "src/default/default.decorators";
import { DefaultCodeEnum } from "src/default/default.enums";
import { AuthenticatedUser } from "src/user/interfaces";
import { CallService } from "../../application";
import { MakeCallInput } from "../dto";

@Controller("call")
@ApiTags("call")
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK })
  async makeCall(
    @Body() input: MakeCallInput,
    @GetAuthenticatedUser() user: AuthenticatedUser
  ): Promise<unknown> {
    const wildixId = user.wildixId;
    if (!wildixId || String(wildixId).trim() === "") {
      throw new BadRequestException("User has no Wildix ID");
    }
    return this.callService.makeCall(wildixId, input.dest_number);
  }
}
