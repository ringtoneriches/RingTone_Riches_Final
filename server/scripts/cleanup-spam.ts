// server/scripts/cleanup-spam.ts
import { db } from "../db";
import { users, suspiciousActivities, transactions } from "../db/schema";
import { eq, or, sql, and, ilike } from "drizzle-orm";

const SUSPICIOUS_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /bit\.ly\/[^\s]+/gi,
  /tinyurl\.com\/[^\s]+/gi,
  /[🚀🔥💎💰💵🎁✨⭐🌟💫💯🤑💸💲🔗📎🔍🌐🕸️🏆👑💪🤩😍✅❌⚠️🏅🎯]/g,
  /\b(bonus|free|offer|limited|promotion|discount|exclusive|premium|gift|cash|money|earn|make money|investment|profit|win|winner|prize|billion|million|thousand|dollar|euro|pound|btc|bitcoin|crypto|mining|trading|forex|stock|rewards)\b/gi,
];

export async function cleanupSpamUsers() {
  console.log("🔍 Starting spam user cleanup...");

  try {
    // Find suspicious users
    const suspiciousUsers = await db.query.users.findMany({
      where: or(
        sql`${users.firstName} ~ 'https?://[^\\s]+'`,
        sql`${users.lastName} ~ 'https?://[^\\s]+'`,
        sql`${users.firstName} ~ '[🚀🔥💎💰💵🎁✨⭐🌟💫💯🤑💸💲]'`,
        sql`${users.lastName} ~ '[🚀🔥💎💰💵🎁✨⭐🌟💫💯🤑💸💲]'`,
        sql`${users.firstName} ~ '(bonus|free|offer|limited|promotion|discount|exclusive|premium|gift|cash|money|earn|make money|investment|profit|win|winner|prize)'`,
        sql`char_length(${users.firstName}) > 50`,
        sql`char_length(${users.lastName}) > 50`,
      ),
    });

    console.log(`📊 Found ${suspiciousUsers.length} suspicious users`);

    let cleanedCount = 0;
    for (const user of suspiciousUsers) {
      console.log(`\n🔍 Processing user ${user.id}: ${user.email}`);
      console.log(`   First name: "${user.firstName}"`);
      console.log(`   Last name: "${user.lastName}"`);

      // Log to suspicious activities
      await db.insert(suspiciousActivities).values({
        ipAddress: user.ipAddress || 'unknown',
        email: user.email,
        reason: `Spam registration detected: "${user.firstName} ${user.lastName}"`,
        userAgent: 'cleanup_script',
        createdAt: new Date(),
      });

      // Check if user has any real activity (transactions, etc.)
      const transactions = await db.query.transactions.findMany({
        where: eq(transactions.userId, user.id),
        limit: 1,
      });

      if (transactions.length === 0) {
        // No transactions - safe to delete
        await db.delete(users).where(eq(users.id, user.id));
        cleanedCount++;
        console.log(`✅ Deleted spam user ${user.id}`);
      } else {
        // Has transactions - just deactivate
        await db.update(users)
          .set({
            isActive: false,
            deletedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        cleanedCount++;
        console.log(`⚠️ Deactivated spam user ${user.id} (had transactions)`);
      }
    }

    console.log(`\n✅ Cleanup complete! Removed ${cleanedCount} spam users`);
    return { cleaned: cleanedCount, total: suspiciousUsers.length };

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupSpamUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}