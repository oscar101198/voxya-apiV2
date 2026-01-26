import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { plainToClass } from "class-transformer";
import {
  TenantEntity,
  TenantSettings,
} from "src/tenant/infrastructure/typeorm/entities";
import { TenantOrmRepository } from "src/tenant/infrastructure/typeorm/repositories";

@Injectable()
export class TenantService {
  constructor(
    @Inject(TenantOrmRepository)
    private readonly tenantRepository: TenantOrmRepository
  ) {}

  /**
   * Get tenant by ID
   */
  async getTenantById(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return plainToClass(TenantEntity, tenant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get tenant by code
   */
  async getTenantByCode(code: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findByCode(code);
    if (!tenant) {
      throw new NotFoundException(`Tenant with code ${code} not found`);
    }

    return plainToClass(TenantEntity, tenant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all tenants with pagination and search
   */
  async getAllTenants(
    limit?: number,
    offset?: number,
    search?: string,
    sort?: string,
    order?: "asc" | "desc"
  ): Promise<[TenantEntity[], number]> {
    const [tenants, total] = await this.tenantRepository.findAll(
      limit,
      offset,
      search,
      sort,
      order
    );

    const transformedTenants = tenants.map((tenant) =>
      plainToClass(TenantEntity, tenant, {
        excludeExtraneousValues: true,
      })
    );

    return [transformedTenants, total];
  }

  /**
   * Create a new tenant
   * Validates code and domain uniqueness
   */
  async createTenant(input: {
    code: string;
    name: string;
    domain?: string;
    settings?: TenantSettings;
    isActive?: boolean;
    subscriptionExpiresAt?: Date;
  }): Promise<TenantEntity> {
    // Validate code uniqueness
    const existingByCode = await this.tenantRepository.findByCode(input.code);
    if (existingByCode) {
      throw new ConflictException(
        `Tenant with code '${input.code}' already exists`
      );
    }

    // Validate domain uniqueness (if provided)
    if (input.domain) {
      const existingByDomain = await this.tenantRepository.findByDomain(
        input.domain
      );
      if (existingByDomain) {
        throw new ConflictException(
          `Tenant with domain '${input.domain}' already exists`
        );
      }
    }

    const tenant = await this.tenantRepository.save({
      ...input,
      isActive: input.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const completeTenant = await this.tenantRepository.findById(tenant.id);
    if (!completeTenant) {
      throw new Error("Failed to retrieve created tenant");
    }

    return plainToClass(TenantEntity, completeTenant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update tenant
   * Validates code and domain uniqueness (if changed)
   */
  async updateTenant(
    id: string,
    input: {
      code?: string;
      name?: string;
      domain?: string;
      settings?: TenantSettings;
      isActive?: boolean;
      subscriptionExpiresAt?: Date;
    }
  ): Promise<TenantEntity> {
    const existingTenant = await this.tenantRepository.findById(id);
    if (!existingTenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Validate code uniqueness (if changed)
    if (input.code && input.code !== existingTenant.code) {
      const existingByCode = await this.tenantRepository.findByCode(input.code);
      if (existingByCode) {
        throw new ConflictException(
          `Tenant with code '${input.code}' already exists`
        );
      }
    }

    // Validate domain uniqueness (if changed)
    if (input.domain && input.domain !== existingTenant.domain) {
      const existingByDomain = await this.tenantRepository.findByDomain(
        input.domain
      );
      if (existingByDomain) {
        throw new ConflictException(
          `Tenant with domain '${input.domain}' already exists`
        );
      }
    }

    const tenant = await this.tenantRepository.update(id, {
      ...input,
      updatedAt: new Date(),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    const completeTenant = await this.tenantRepository.findById(id);
    if (!completeTenant) {
      throw new Error("Failed to retrieve updated tenant");
    }

    return plainToClass(TenantEntity, completeTenant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    const deleted = await this.tenantRepository.softDelete(id);
    if (!deleted) {
      throw new Error("Failed to delete tenant");
    }

    return plainToClass(TenantEntity, tenant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update tenant settings
   */
  async updateSettings(
    id: string,
    settings: TenantSettings
  ): Promise<TenantEntity> {
    return this.updateTenant(id, { settings });
  }

  /**
   * Merge tenant settings (partial update)
   */
  async mergeSettings(
    id: string,
    partialSettings: Partial<TenantSettings>
  ): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    const mergedSettings = {
      ...(tenant.settings || {}),
      ...partialSettings,
    };

    return this.updateTenant(id, { settings: mergedSettings });
  }
}
