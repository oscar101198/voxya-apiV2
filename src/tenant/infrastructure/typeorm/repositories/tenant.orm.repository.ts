import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantEntity } from "../entities/tenant.orm.entity";

@Injectable()
export class TenantOrmRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>
  ) {}

  private isValidSortField(field: string): boolean {
    return !!this.tenantRepository.metadata.findColumnWithPropertyName(field);
  }

  // Basic CRUD operations
  async findById(id: string): Promise<TenantEntity | null> {
    return this.tenantRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async findByCode(code: string): Promise<TenantEntity | null> {
    return this.tenantRepository.findOne({
      where: { code },
      withDeleted: false,
    });
  }

  async findByDomain(domain: string): Promise<TenantEntity | null> {
    return this.tenantRepository.findOne({
      where: { domain },
      withDeleted: false,
    });
  }

  async findAll(
    limit?: number,
    offset?: number,
    search?: string,
    sort?: string,
    order?: "asc" | "desc"
  ): Promise<[TenantEntity[], number]> {
    const sortField = sort && this.isValidSortField(sort) ? sort : "createdAt";
    const sortOrder = order?.toUpperCase() || "DESC";
    const queryBuilder = this.tenantRepository
      .createQueryBuilder("tenant")
      .where("tenant.deletedAt IS NULL")
      .orderBy(`tenant.${sortField}`, sortOrder as "ASC" | "DESC");

    if (search) {
      queryBuilder.andWhere(
        `(
          LOWER(tenant.code) LIKE LOWER(:search) OR
          LOWER(tenant.name) LIKE LOWER(:search) OR
          LOWER(tenant.domain) LIKE LOWER(:search)
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

  async save(tenant: Partial<TenantEntity>): Promise<TenantEntity> {
    const newTenant = this.tenantRepository.create(tenant);
    return this.tenantRepository.save(newTenant);
  }

  async update(
    id: string,
    tenant: Partial<TenantEntity>
  ): Promise<TenantEntity | null> {
    await this.tenantRepository.update(id, tenant);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.tenantRepository.softDelete(id);
    return result.affected ? result.affected > 0 : false;
  }
}

