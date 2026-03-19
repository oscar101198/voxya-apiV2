import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("refresh_tokens")
@Index(["tokenHash"], { unique: true })
@Index(["userId"])
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @Column({ type: "varchar", length: 255, name: "token_hash" })
  tokenHash: string;

  @Column({ type: "timestamp", name: "expires_at" })
  expiresAt: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
