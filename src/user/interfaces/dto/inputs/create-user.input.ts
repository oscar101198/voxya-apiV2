import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateUserInput {
  @ApiProperty({
    description: "Email de l'utilisateur",
    example: "john.doe@example.com",
    maxLength: 255,
  })
  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: "L'email doit être valide" })
  @MaxLength(255, {
    message: "L'email ne peut pas dépasser 255 caractères",
  })
  email: string;

  @ApiProperty({
    description: "Mot de passe",
    example: "motdepasse123",
  })
  @IsNotEmpty({ message: "Le mot de passe est requis" })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: "Prénom de l'utilisateur",
    example: "John",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Le prénom ne peut pas dépasser 100 caractères",
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: "Nom de famille de l'utilisateur",
    example: "Doe",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Le nom de famille ne peut pas dépasser 100 caractères",
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: "Numéro de téléphone de l'utilisateur",
    example: "+33 1 23 45 67 89",
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, {
    message: "Le numéro de téléphone ne peut pas dépasser 20 caractères",
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: "Plan d'abonnement",
    example: "free",
    default: "free",
  })
  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @ApiPropertyOptional({
    description: "Identifiant Wildix",
    example: "wildix_id_123",
  })
  @IsOptional()
  @IsString()
  wildixId?: string;
}
