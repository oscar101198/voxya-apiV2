import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { SortOrderEnum } from "src/default/default.enums";

export class GetTenantsQuery {
  @ApiProperty({
    description: "Limite de tenants à récupérer",
    example: 25,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: "Numéro de page à récupérer",
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description:
      "Terme de recherche pour filtrer les tenants par code, nom ou domaine",
    example: "acme",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Champ de tri (ex: createdAt, name, code, domain)",
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
