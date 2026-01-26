import { seed } from "./seed";

async function seedWithClear() {
  try {
    console.log("🌱 Starting database seeding with data clearing...\n");

    // Seed database with data clearing
    await seed(true);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 You can now use these test accounts:");
    console.log("👤 admin / admin123 (Admin with full access)");
    console.log("👤 marie.martin / password123 (Designer & Manager)");
    console.log("👤 pierre.durand / password123 (Project Manager)");
    console.log("👤 sophie.bernard / password123 (Marketing Manager)");
    console.log("👤 thomas.moreau / password123 (Support Specialist)");
    console.log("👤 alice.petit / password123 (Developer)");
  } catch (error) {
    console.error("❌ Error during seeding process:", error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedWithClear();
}

export { seedWithClear };
