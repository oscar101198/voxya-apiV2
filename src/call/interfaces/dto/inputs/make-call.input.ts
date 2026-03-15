import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class MakeCallInput {
  @ApiProperty({
    description: "Phone number to call (destination)",
    type: String,
    required: true,
    nullable: false,
    example: "+33612345678",
  })
  @IsString()
  @IsNotEmpty()
  dest_number: string;
}
