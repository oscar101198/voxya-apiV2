import { resetDatabase } from "./reset";
import { seed } from "./seed";

async function resetAndSeed() {
  try {
    console.log("🚀 Starting database reset and seed process...\n");

    // Reset database
    await resetDatabase();
    console.log("\n");

    // Seed database (no need to clear data since we just reset)
    await seed(false);

    console.log("\n🎉 Database reset and seed completed successfully!");
    console.log("\n📋 You can now use these test accounts:");
    console.log("👤 admin / admin123 (Admin with full access)");
    console.log("👤 marie.martin / password123 (Designer & Manager)");
    console.log("👤 pierre.durand / password123 (Project Manager)");
    console.log("👤 sophie.bernard / password123 (Marketing Manager)");
    console.log("👤 thomas.moreau / password123 (Support Specialist)");
    console.log("👤 alice.petit / password123 (Developer)");
  } catch (error) {
    console.error("❌ Error during reset and seed process:", error);
    process.exit(1);
  }
}

// Run the reset and seed function
if (require.main === module) {
  resetAndSeed();
}

export { resetAndSeed };
