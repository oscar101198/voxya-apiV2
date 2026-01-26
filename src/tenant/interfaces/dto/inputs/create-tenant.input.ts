import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { TenantSettings } from "src/tenant/infrastructure/typeorm/entities";

export class CreateTenantInput {
  @ApiProperty({
    description: "Code unique du tenant (ex: 'acme-corp', 'voxya-demo')",
    example: "acme-corp",
    required: true,
  })
  @IsNotEmpty({ message: "Le code du tenant est requis" })
  @IsString()
  @MinLength(2, { message: "Le code doit contenir au moins 2 caractères" })
  @MaxLength(100, { message: "Le code ne peut pas dépasser 100 caractères" })
  code: string;

  @ApiProperty({
    description: "Nom commercial du tenant",
    example: "ACME Corporation",
    required: true,
  })
  @IsNotEmpty({ message: "Le nom du tenant est requis" })
  @IsString()
  @MaxLength(255, { message: "Le nom ne peut pas dépasser 255 caractères" })
  name: string;

  @ApiPropertyOptional({
    description: "Domaine email du tenant (ex: 'acme-corp.com')",
    example: "acme-corp.com",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "Le domaine ne peut pas dépasser 255 caractères",
  })
  domain?: string;

  @ApiPropertyOptional({
    description: "Configuration spécifique du tenant (JSON)",
    example: { theme: "dark", language: "fr" },
    required: false,
  })
  @IsOptional()
  @IsObject()
  settings?: TenantSettings;

  @ApiPropertyOptional({
    description: "Indique si le tenant est actif",
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Date d'expiration de l'abonnement",
    example: "2025-12-31T23:59:59Z",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  subscriptionExpiresAt?: string;
}

