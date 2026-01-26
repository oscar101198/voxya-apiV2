import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { SortOrderEnum } from "src/default/default.enums";

export class GetAllUsersQuery {
  @ApiProperty({
    description: "Limite d'utilisateurs à récupérer",
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: "Numéro de page à récupérer",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  page?: number;


  @ApiProperty({
    description:
      "Terme de recherche pour filtrer les utilisateurs sur tous les champs",
    example: "john.doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Champ de tri (ex: createdAt, username, updatedAt)",
    example: "createdAt",
    required: false,
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({
    description: "Ordre de tri (asc ou desc)",
    example: "desc",
    enum: SortOrderEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum)
  order?: SortOrderEnum;
}
