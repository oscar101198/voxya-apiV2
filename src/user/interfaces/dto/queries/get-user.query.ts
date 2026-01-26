import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class GetUserQuery {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: "string",
    format: "uuid",
    required: true,
  })
  @IsUUID("4", {
    message: "L'identifiant de l'utilisateur doit être un UUID valide",
  })
  @IsNotEmpty({ message: "L'identifiant de l'utilisateur est requis" })
  id: string;
}
