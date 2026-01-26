import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../entities/user.orm.entity";

@Injectable()
export class UserOrmRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  private isValidSortField(field: string): boolean {
    return !!this.userRepository.metadata.findColumnWithPropertyName(field);
  }

  // Basic CRUD operations
  async findById(
    id: string,
    tenantId: string | null
  ): Promise<UserEntity | null> {
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .where("user.id = :id", { id })
      .andWhere("user.deletedAt IS NULL");

    if (tenantId) {
      queryBuilder.andWhere("user.tenantId = :tenantId", { tenantId });
    }

    return queryBuilder.getOne();
  }

  async findByIdForAuth(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  // Find user by email without tenant filter (for login)
  async findByEmailForAuth(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
      withDeleted: false,
    });
  }

  async findByEmail(
    email: string,
    tenantId: string
  ): Promise<UserEntity | null> {
    return this.userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .andWhere("user.deletedAt IS NULL")
      .andWhere("user.tenantId = :tenantId", { tenantId })
      .getOne();
  }

  async findAll(
    tenantId: string,
    limit?: number,
    offset?: number,
    search?: string,
    sort?: string,
    order?: "asc" | "desc"
  ): Promise<[UserEntity[], number]> {
    const sortField = sort && this.isValidSortField(sort) ? sort : "createdAt";
    const sortOrder = order?.toUpperCase() || "DESC";
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .where("user.deletedAt IS NULL")
      .andWhere("user.tenantId = :tenantId", { tenantId })
      .orderBy(`user.${sortField}`, sortOrder as "ASC" | "DESC");

    if (search) {
      queryBuilder.andWhere(
        `(
          LOWER(user.email) LIKE LOWER(:search) OR
          LOWER(user.firstName) LIKE LOWER(:search) OR
          LOWER(user.lastName) LIKE LOWER(:search) OR
          LOWER(user.phoneNumber) LIKE LOWER(:search)
        )`,
        { search: `%${search}%` }
      );
    }

    if (limit) {
      queryBuilder.take(limit);
    }
    if (offset) {
      queryBuilder.skip(offset);
    }

    const [entities, total] = await queryBuilder.getManyAndCount();
    return [entities, total];
  }

  async save(user: Partial<UserEntity>): Promise<UserEntity> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async update(
    id: string,
    user: Partial<UserEntity>,
    tenantId: string | null
  ): Promise<UserEntity | null> {
    if (tenantId) {
      const existingUser = await this.findById(id, tenantId);
      if (!existingUser) {
        return null;
      }
    }
    await this.userRepository.update(id, user);
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const user = await this.findById(id, tenantId);
    if (!user) {
      return false;
    }
    const result = await this.userRepository.softDelete(id);
    return result.affected ? result.affected > 0 : false;
  }

  // Count operations
  async getUserCount(tenantId: string): Promise<number> {
    return this.userRepository
      .createQueryBuilder("user")
      .where("user.deletedAt IS NULL")
      .andWhere("user.tenantId = :tenantId", { tenantId })
      .getCount();
  }
}
