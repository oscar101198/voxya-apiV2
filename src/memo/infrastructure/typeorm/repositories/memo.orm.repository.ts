import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MemoEntity } from "../entities/memo.orm.entity";

@Injectable()
export class MemoOrmRepository {
  constructor(
    @InjectRepository(MemoEntity)
    private readonly memoRepository: Repository<MemoEntity>
  ) {}

  /**
   * Save a memo entity
   */
  async save(memo: Partial<MemoEntity>): Promise<MemoEntity> {
    const newMemo = this.memoRepository.create(memo);
    return this.memoRepository.save(newMemo);
  }

  /**
   * Find memo by ID with tenant validation
   * Verifies that the memo belongs to a user from the specified tenant
   */
  async findById(id: string, tenantId: string): Promise<MemoEntity | null> {
    return this.memoRepository
      .createQueryBuilder("memo")
      .innerJoin("users", "user", "user.id = memo.userId")
      .where("memo.id = :id", { id })
      .andWhere("memo.deletedAt IS NULL")
      .andWhere("user.tenantId = :tenantId", { tenantId })
      .andWhere("user.deletedAt IS NULL")
      .getOne();
  }

  /**
   * Soft delete a memo with tenant validation
   * Verifies that the memo belongs to a user from the specified tenant
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const memo = await this.findById(id, tenantId);
    if (!memo) {
      return false;
    }
    const result = await this.memoRepository.softDelete(id);
    return result.affected ? result.affected > 0 : false;
  }
}
