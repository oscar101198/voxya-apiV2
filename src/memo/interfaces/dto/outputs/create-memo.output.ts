import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CreateMemoOutput {
  @ApiProperty({
    description: "Identifiant unique du memo",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: "string",
    format: "uuid",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "URL publique du fichier audio dans MinIO",
    example: "http://localhost:9000/memos/user-id/timestamp-audio.mp3",
  })
  @Expose()
  audioUrl: string;

  @ApiProperty({
    description: "Nom original du fichier",
    example: "audio.mp3",
  })
  @Expose()
  fileName: string;

  @ApiProperty({
    description: "Taille du fichier en bytes",
    example: 5242880,
  })
  @Expose()
  fileSize: number;

  @ApiProperty({
    description: "Date de création",
    example: "2024-01-15T10:30:00Z",
    type: "string",
    format: "date-time",
  })
  @Expose()
  createdAt: Date;
}
