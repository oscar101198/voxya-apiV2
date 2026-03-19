import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenOutput {
  @ApiProperty({
    type: String,
    nullable: false,
    example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9",
  })
  accessToken: string;

  @ApiProperty({
    type: String,
    nullable: false,
    description: "New refresh token (rotation); client must store and use this for next refresh.",
  })
  refreshToken: string;
}
