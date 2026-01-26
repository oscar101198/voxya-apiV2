import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export interface TenantSettings {
  [key: string]: any;
}

@Entity("tenants")
@Index(["code"], { unique: true })
export class TenantEntity {
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty({
    description: "Identifiant unique du tenant",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: "string",
    format: "uuid",
    required: true,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Code unique du tenant (ex: 'acme-corp', 'voxya-demo')",
    example: "acme-corp",
    required: true,
  })
  @Expose()
  @Column({ type: "varchar", length: 100, unique: true })
  code: string;

  @ApiProperty({
    description: "Nom commercial du tenant",
    example: "ACME Corporation",
    required: true,
  })
  @Expose()
  @Column({ type: "varchar", length: 255 })
  name: string;

  @ApiPropertyOptional({
    description: "Domaine email du tenant (ex: 'acme-corp.com')",
    example: "acme-corp.com",
    required: false,
  })
  @Expose()
  @Column({ type: "varchar", length: 255, nullable: true, unique: true })
  domain?: string;

  @ApiPropertyOptional({
    description: "Configuration spécifique du tenant (JSON)",
    example: { theme: "dark", language: "fr" },
    required: false,
  })
  @Expose()
  @Column({ type: "jsonb", nullable: true })
  settings?: TenantSettings;

  @ApiProperty({
    description: "Indique si le tenant est actif",
    example: true,
    required: true,
    default: true,
  })
  @Expose()
  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @ApiPropertyOptional({
    description: "Date d'expiration de l'abonnement",
    example: "2025-12-31T23:59:59Z",
    type: "string",
    format: "date-time",
    required: false,
  })
  @Expose()
  @Column({ type: "timestamp", nullable: true })
  subscriptionExpiresAt?: Date;

  @ApiProperty({
    description: "Date de création du tenant",
    example: "2024-01-15T10:30:00Z",
    type: "string",
    format: "date-time",
    required: true,
  })
  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Date de mise à jour du tenant",
    example: "2024-01-15T10:30:00Z",
    type: "string",
    format: "date-time",
    required: true,
  })
  @UpdateDateColumn()
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: "Date de suppression du tenant",
    example: "2024-01-15T10:30:00Z",
    type: "string",
    format: "date-time",
    required: false,
  })
  @DeleteDateColumn()
  @Expose()
  deletedAt?: Date;
}
