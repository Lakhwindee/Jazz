import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Creating default admin account...");
  
  try {
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      name: "Admin",
      handle: "@admin",
      email: "admin@instacreator.com",
      password: hashedPassword,
      role: "admin",
      followers: 0,
      engagement: "0.00",
      reach: 0,
      isVerified: true,
      tier: "Admin",
      balance: "0.00",
      subscriptionPlan: "pro",
    });
    console.log("✓ Admin account created!");
  } catch (error: any) {
    if (error.message?.includes("duplicate key")) {
      console.log("✓ Admin account already exists");
    } else {
      console.error("Error creating admin:", error);
    }
  }
}

export default seed;
