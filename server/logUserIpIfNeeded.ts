import { userIpLogs } from "@shared/schema";
import { db } from "./db";
import { getClientIp } from "./routes";

export  async function logUserIpIfNeeded(req: any) {
    try {
      if (!req.session?.userId) return;
  
      const userId = req.session.userId;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "";
  
      // check last log (avoid spam)
      const lastLog = await db.query.userIpLogs.findFirst({
        where: (l, { eq }) => eq(l.userId, userId),
        orderBy: (l, { desc }) => desc(l.createdAt),
      });
  
      // only log if different IP
      if (!lastLog || lastLog.ipAddress !== ip) {
        await db.insert(userIpLogs).values({
          userId,
          ipAddress: ip,
          userAgent: ua,
        });
      }
    } catch (err) {
      console.error("IP log failed:", err);
    }
  }
  
