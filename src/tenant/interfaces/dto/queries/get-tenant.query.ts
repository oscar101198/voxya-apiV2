import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class GetTenantQuery {
  @ApiProperty({
    description: "Identifiant unique du tenant",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: "string",
    format: "uuid",
    required: true,
  })
  @IsUUID("4", { message: "L'ID du tenant doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID du tenant est requis" })
  id: string;
}

