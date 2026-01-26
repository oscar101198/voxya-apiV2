import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RegisterFcmTokenInput {
  @ApiProperty({
    description: "Token FCM à enregistrer",
    example: "fcm_token_example_123456789",
    maxLength: 1000,
  })
  @IsNotEmpty({ message: "Le token FCM est requis" })
  @IsString()
  @MaxLength(1000, {
    message: "Le token FCM ne peut pas dépasser 1000 caractères",
  })
  fcmToken: string;
}
