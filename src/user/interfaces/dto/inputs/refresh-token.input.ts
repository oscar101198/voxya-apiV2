import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenInput {
  @ApiProperty({
    type: String,
    required: true,
    nullable: false,
    description: "Refresh token received at login.",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
