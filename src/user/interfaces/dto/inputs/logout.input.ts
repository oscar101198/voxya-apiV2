import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LogoutInput {
  @ApiProperty({
    type: String,
    required: true,
    nullable: false,
    description: "Refresh token to revoke for this device.",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
