import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("memos")
@Index(["userId"])
@Index(["deletedAt"])
export class MemoEntity {
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty({
    description: "Identifiant unique du memo",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: "string",
    format: "uuid",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Identifiant de l'utilisateur propriétaire du memo",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: "string",
    format: "uuid",
  })
  @Expose()
  @Column({ type: "uuid", nullable: false, name: "user_id" })
  userId: string;

  @ApiProperty({
    description: "URL publique du fichier audio dans MinIO",
    example: "http://localhost:9000/memos/user-id/timestamp-audio.mp3",
  })
  @Expose()
  @Column({ type: "varchar", length: 500, nullable: false, name: "audio_url" })
  audioUrl: string;

  @ApiProperty({
    description: "Clé MinIO pour la suppression du fichier",
    example: "memos/user-id/timestamp-audio.mp3",
  })
  @Exclude()
  @Column({ type: "varchar", length: 500, nullable: false, name: "audio_key" })
  audioKey: string;

  @ApiProperty({
    description: "Nom original du fichier",
    example: "audio.mp3",
  })
  @Expose()
  @Column({ type: "varchar", length: 255, nullable: false, name: "file_name" })
  fileName: string;

  @ApiProperty({
    description: "Taille du fichier en bytes",
    example: 5242880,
  })
  @Expose()
  @Column({ type: "integer", nullable: false, name: "file_size" })
  fileSize: number;

  @ApiProperty({
    description: "Type MIME du fichier",
    example: "audio/mpeg",
  })
  @Expose()
  @Column({ type: "varchar", length: 100, nullable: false, name: "mime_type" })
  mimeType: string;

  @ApiPropertyOptional({
    description: "Durée du fichier audio en secondes",
    example: 120,
  })
  @Expose()
  @Column({ type: "integer", nullable: true, name: "duration" })
  duration?: number;

  @ApiProperty({
    description: "Date de création",
    example: "2024-01-15T10:30:00Z",
    type: "string",
    format: "date-time",
  })
  @Expose()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ApiProperty({
    description: "Date de mise à jour",
    example: "2024-01-15T10:30:00Z",
    type: "string",
    format: "date-time",
  })
  @Expose()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: "Date de suppression",
    example: "2024-01-15T10:30:00Z",
    type: "string",
    format: "date-time",
  })
  @Exclude()
  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}
