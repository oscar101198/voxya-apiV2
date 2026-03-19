import { ApiProperty } from "@nestjs/swagger";
import { UserEntity } from "src/user/infrastructure/typeorm/entities";

export class UserAuthOutput {
  @ApiProperty({
    type: String,
    nullable: false,
    required: false,
    example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9",
  })
  accessToken: string;

  @ApiProperty({
    type: String,
    nullable: false,
    description: "Opaque refresh token; use POST /user/refresh to get a new access token.",
  })
  refreshToken: string;

  @ApiProperty({
    type: UserEntity,
    required: false,
    nullable: false,
  })
  user: UserEntity;
}
