import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL must be set");
    process.exit(1);
  }

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set");
    console.error(
      "   Example: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='your-secure-password' npm run create-admin",
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("❌ ADMIN_PASSWORD must be at least 12 characters");
    process.exit(1);
  }

  console.log("👤 Creating admin user...\n");

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await sql`
      SELECT id, is_admin FROM users WHERE LOWER(email) = ${email}
    `;

    if (existing.length > 0) {
      if (existing[0].is_admin) {
        console.log("ℹ️  An admin account with this email already exists. No changes made.\n");
        return;
      }

      console.error(
        `❌ ${email} already exists but is not an admin. Promote via the admin panel or database instead of re-running this script.`,
      );
      process.exit(1);
    }

    await sql`
      INSERT INTO users (email, password, is_admin, balance, ringtone_points, email_verified, first_name, last_name)
      VALUES (${email}, ${hashedPassword}, true, 0, 0, true, 'Admin', 'User')
    `;

    console.log(`✅ Admin user created for ${email}`);
    console.log("\n💡 Log in at /admin/login\n");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
