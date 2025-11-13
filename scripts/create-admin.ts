import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";

const sql = neon(process.env.DATABASE_URL!);

async function createAdmin() {
  console.log("👤 Creating admin user...\n");

  try {
    const email = "admin@ringtoneriches.co.uk";
    const password = "Admin123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.log("⚠️  Admin user already exists, updating to ensure admin privileges...");
      await sql`
        UPDATE users 
        SET is_admin = true, password = ${hashedPassword}
        WHERE email = ${email}
      `;
      console.log("✅ Admin user updated successfully!\n");
    } else {
      console.log("📝 Creating new admin user...");
      await sql`
        INSERT INTO users (email, password, is_admin, balance, ringtone_points)
        VALUES (${email}, ${hashedPassword}, true, 0, 0)
      `;
      console.log("✅ Admin user created successfully!\n");
    }

    console.log("🎉 Admin Account Details:");
    console.log("   Email: admin@ringtoneriches.co.uk");
    console.log("   Password: Admin123!");
    console.log("\n💡 You can now log in at /login");
    console.log("   Then visit /admin to access the admin panel\n");
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
