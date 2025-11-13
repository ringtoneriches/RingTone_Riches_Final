import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./customAuth";
import { eq } from "drizzle-orm";

export async function autoCreateAdmin() {
  // Only run in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    console.log("🔍 Checking if admin user needs to be created...");

    const email = "admin@ringtoneriches.co.uk";
    const password = "Admin123!";

    // Check if admin already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing.length > 0) {
      console.log("✅ Admin user already exists");
      return;
    }

    console.log("👤 Creating admin user...");
    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
      email,
      password: hashedPassword,
      isAdmin: true,
      balance: "0.00",
      ringtonePoints: 0
    });

    console.log("✅ Admin user created successfully!");
    console.log("   Email: admin@ringtoneriches.co.uk");
    console.log("   Password: Admin123!");
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    // Don't throw - let the server start anyway
  }
}
