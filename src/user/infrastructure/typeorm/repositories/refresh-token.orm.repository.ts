import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RefreshTokenEntity } from "../entities/refresh-token.orm.entity";

@Injectable()
export class RefreshTokenOrmRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>
  ) {}

  async save(entity: Partial<RefreshTokenEntity>): Promise<RefreshTokenEntity> {
    const created = this.refreshTokenRepository.create(entity);
    return this.refreshTokenRepository.save(created);
  }

  async findByTokenHash(
    tokenHash: string
  ): Promise<RefreshTokenEntity | null> {
    return this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    const result = await this.refreshTokenRepository.delete({ tokenHash });
    return result.affected ? result.affected > 0 : false;
  }
}
