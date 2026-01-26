// Import the existing DataSource
import { DataSource } from "typeorm";
import dataSource from "../../../typeorm.config";

async function resetDatabase() {
  try {
    console.log("🗑️  Starting database reset...");

    // Initialize DataSource
    await dataSource.initialize();
    console.log("✅ Database connection established");

    // Drop all tables
    await dropAllTables(dataSource);
    console.log("🧹 All tables dropped");

    // Create schema using synchronize (since no migrations exist)
    await createSchema();
    console.log("🔄 Schema created using synchronize");

    await dataSource.destroy();
    console.log("✅ Database reset completed successfully!");
  } catch (error) {
    console.error("❌ Error during database reset:", error);
    await dataSource.destroy();
    process.exit(1);
  }
}

async function dropAllTables(dataSource: DataSource) {
  // Get all table names
  const tables = await dataSource.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename != 'migrations'
  `);

  if (tables.length === 0) {
    console.log("ℹ️  No tables to drop");
    return;
  }

  // Drop all tables with CASCADE to handle foreign key constraints
  for (const table of tables) {
    await dataSource.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
    console.log(`🗑️  Dropped table: ${table.tablename}`);
  }
}

async function createSchema() {
  try {
    // Use TypeORM CLI to sync schema
    const { exec } = require("child_process");
    const util = require("util");
    const execAsync = util.promisify(exec);

    console.log("🔄 Syncing schema...");
    await execAsync("yarn schema:sync");
    console.log("✅ Schema synced");
  } catch (error) {
    console.log("⚠️  Schema sync failed, trying synchronize...");
    // Fallback: create a new DataSource with synchronize enabled
    const { DataSource } = require("typeorm");
    const tempDataSource = new DataSource({
      ...dataSource.options,
      synchronize: true,
    });

    await tempDataSource.initialize();
    await tempDataSource.synchronize();
    await tempDataSource.destroy();
    console.log("✅ Schema synchronized");
  }
}

// Run the reset function
if (require.main === module) {
  resetDatabase();
}

export { resetDatabase };
