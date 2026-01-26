import { Faker, fr } from "@faker-js/faker";
import * as bcrypt from "bcryptjs";
import { DataSource } from "typeorm";

// Import entities
import { TenantEntity } from "../../tenant/infrastructure/typeorm/entities/tenant.orm.entity";
import { UserEntity } from "../../user/infrastructure/typeorm/entities/user.orm.entity";

// Import the existing DataSource
import dataSource from "../../../typeorm.config";

const CORE_TENANT_CODE = "CORE";

// Configure Faker with French locale
const faker = new Faker({ locale: fr });

// Helper functions for random data generation
function randomInt(min: number, max: number): number {
  return faker.number.int({ min, max });
}

function randomChoice<T>(array: T[]): T {
  return faker.helpers.arrayElement(array);
}

async function seed(clearData = false) {
  try {
    console.log("🌱 Starting database seeding...");

    // Initialize DataSource
    await dataSource.initialize();
    console.log("✅ Database connection established");

    // Clear existing data only if requested
    if (clearData) {
      await clearDatabase(dataSource);
      console.log("🧹 Database cleared");
    }

    // Seed data
    const { tenants, users } = await seedData(dataSource);
    console.log("📊 Data seeded successfully");

    // Log summary
    console.log("\n📋 Seeding Summary:");
    console.log(`- ${tenants.length} tenants created`);
    console.log(`- ${users.length} users created`);

    await dataSource.destroy();
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    await dataSource.destroy();
    process.exit(1);
  }
}

async function clearDatabase(dataSource: DataSource) {
  const entities = ["users", "tenants"];

  for (const entity of entities) {
    try {
      await dataSource.query(`DELETE FROM ${entity}`);
    } catch (error) {
      // Table might not exist, skip silently
      console.log(`ℹ️  Table ${entity} does not exist, skipping...`);
    }
  }
}

async function seedData(dataSource: DataSource) {
  // 1. Create Tenants (must be first)
  const tenants = await createTenants(dataSource);
  const coreTenant = tenants.find((t) => t.code === CORE_TENANT_CODE)!;
  const otherTenants = tenants.filter((t) => t.code !== CORE_TENANT_CODE);

  // 2. Create Users
  const users = await createUsers(dataSource, tenants, coreTenant, otherTenants);

  return {
    tenants,
    users,
  };
}

async function createTenants(dataSource: DataSource): Promise<TenantEntity[]> {
  const tenantRepository = dataSource.getRepository(TenantEntity);

  const tenantsData = [
    {
      code: CORE_TENANT_CODE,
      name: "Core Tenant",
      domain: "core.voxya.com",
      isActive: true,
      subscriptionExpiresAt: undefined, // Core tenant never expires
    },
    {
      code: `tenant-${randomInt(1000, 9999)}`,
      name: `Tenant ${randomChoice([
        "Alpha",
        "Beta",
        "Gamma",
        "Delta",
        "Epsilon",
      ])}`,
      domain: `tenant-${randomInt(1000, 9999)}.voxya.com`,
      isActive: true,
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      code: `tenant-${randomInt(1000, 9999)}`,
      name: `Tenant ${randomChoice([
        "Sigma",
        "Omega",
        "Lambda",
        "Theta",
        "Zeta",
      ])}`,
      domain: `tenant-${randomInt(1000, 9999)}.voxya.com`,
      isActive: true,
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  ];

  const tenants = (await tenantRepository.save(tenantsData)) as TenantEntity[];
  console.log(`✅ Created ${tenants.length} tenants (1 CORE + 2 random)`);
  return tenants;
}

async function createUsers(
  dataSource: DataSource,
  tenants: TenantEntity[],
  coreTenant: TenantEntity,
  otherTenants: TenantEntity[]
): Promise<UserEntity[]> {
  const userRepository = dataSource.getRepository(UserEntity);

  const allUsers: UserEntity[] = [];

  // Create CORE admin user
  const coreAdminUser = await userRepository.save({
    email: "admin@core.voxya.com",
    password: await bcrypt.hash("admin123", 10),
    firstName: "Admin",
    lastName: "Core",
    phoneNumber: "+33 6 00 00 00 00",
    subscriptionPlan: "premium",
    isActive: true,
    tenantId: coreTenant.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  allUsers.push(coreAdminUser);
  console.log("✅ Created CORE admin user");

  // Create users for other tenants
  const subscriptionPlans = ["free", "basic", "premium", "enterprise"];

  for (const tenant of otherTenants) {
    // Create 20-30 users per tenant
    const numUsers = randomInt(20, 30);

    for (let i = 0; i < numUsers; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({
        firstName,
        lastName,
        provider: tenant.domain || "example.com",
      });
      const hashedPassword = await bcrypt.hash("password123", 10);
      const phoneNumber = `+33 6 ${faker.string.numeric(
        2
      )} ${faker.string.numeric(2)} ${faker.string.numeric(
        2
      )} ${faker.string.numeric(2)}`;

      const user = await userRepository.save({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        subscriptionPlan: randomChoice(subscriptionPlans),
        wildixId: faker.datatype.boolean({ probability: 0.5 }) ? `wildix_${faker.string.alphanumeric(10)}` : undefined,
        isActive: faker.datatype.boolean({ probability: 0.9 }), // 90% active
        tenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: faker.datatype.boolean({ probability: 0.7 }) ? faker.date.recent({ days: 30 }) : undefined,
      });

      allUsers.push(user);
    }
  }

  console.log(
    `✅ Created ${allUsers.length} users (1 CORE admin + 20-30 per other tenant)`
  );
  return allUsers;
}

// Run the seed function
if (require.main === module) {
  seed();
}

export { seed };
