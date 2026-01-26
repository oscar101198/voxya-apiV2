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

@Entity("users")
@Index(["tenantId"])
@Index(["email"], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty({
    description: "Identifiant unique du user",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: "string",
    format: "uuid",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Email de l'utilisateur",
    example: "john.doe@example.com",
  })
  @Expose()
  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @ApiProperty({
    description: "Mot de passe haché du user",
    example: "$2b$10$6ERhNqkKckjKqltk1pZ7eufZnPiUvN4zv.C52v88NriAyKZ6G0uAa",
  })
  @Exclude()
  @Column({ type: "varchar", length: 255, name: "password" })
  password: string;

  @ApiPropertyOptional({
    description: "Prénom de l'utilisateur",
    example: "John",
  })
  @Expose()
  @Column({ type: "varchar", length: 100, nullable: true, name: "first_name" })
  firstName?: string;

  @ApiPropertyOptional({
    description: "Nom de famille de l'utilisateur",
    example: "Doe",
  })
  @Expose()
  @Column({ type: "varchar", length: 100, nullable: true, name: "last_name" })
  lastName?: string;

  @ApiPropertyOptional({
    description: "Numéro de téléphone de l'utilisateur",
    example: "+33 1 23 45 67 89",
  })
  @Expose()
  @Column({ type: "varchar", length: 20, nullable: true, name: "phone_number" })
  phoneNumber?: string;

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

  @ApiPropertyOptional({
    description: "Date de dernière connexion",
    example: "2024-01-15T10:30:00Z",
    type: "string",
    format: "date-time",
  })
  @Expose()
  @Column({ type: "timestamp", nullable: true, name: "last_login" })
  lastLogin?: Date;

  @ApiProperty({
    description: "Indique si l'utilisateur est actif",
    example: true,
    default: true,
  })
  @Expose()
  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive: boolean;

  @ApiProperty({
    description: "Plan d'abonnement de l'utilisateur",
    example: "free",
    default: "free",
  })
  @Expose()
  @Column({ type: "varchar", length: 50, default: "free", name: "subscription_plan" })
  subscriptionPlan: string;

  @ApiPropertyOptional({
    description: "Identifiant Wildix",
    example: "wildix_id_123",
  })
  @Expose()
  @Column({ type: "varchar", length: 255, nullable: true, name: "wildix_id" })
  wildixId?: string;

  @ApiProperty({
    description: "Identifiant du tenant",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: "string",
    format: "uuid",
  })
  @Expose({ toClassOnly: true })
  @Column({ type: "uuid", nullable: false, name: "tenant_id" })
  tenantId: string;
  
  @ApiPropertyOptional({
    description: "Token FCM pour les notifications push",
    example: "fcm_token_example_123456789",
    required: false,
  })
  @Exclude()
  @Column({ type: "text", nullable: true, name: "fcm_token" })
  fcmToken?: string;
}
