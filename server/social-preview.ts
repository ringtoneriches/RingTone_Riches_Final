import type { Request, Response, NextFunction } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { competitions } from "@shared/schema";

const BOT_USER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "TelegramBot",
  "Slackbot",
  "Pinterest",
  "Discordbot",
  "vkShare",
  "Embedly",
  "redditbot",
];

function isBot(userAgent: string = ""): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

function escapeHtml(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// imageUrl in DB might already be a full R2/S3 URL, or might be a relative
// path depending on which uploader wrote it. Handle both.
const SITE_URL = "https://ringtoneriches.co.uk";
function toAbsoluteImage(imageUrl: string | null): string {
  if (!imageUrl) return `${SITE_URL}/ringtune.png`; // fallback to your default
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${SITE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

export async function socialPreviewMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userAgent = req.headers["user-agent"] || "";

  if (!isBot(userAgent)) return next(); // real users -> normal React app, untouched

  const match = req.path.match(/^\/competition\/([a-zA-Z0-9-]+)\/?$/);
  if (!match) return next(); // not a competition page

  const competitionId = match[1];

  try {
    const rows = await db
      .select()
      .from(competitions)
      .where(
        and(
          eq(competitions.id, competitionId),
          eq(competitions.status, "active")
        )
      )
      .limit(1);

    if (!rows.length) return next(); // not found / inactive -> fall back to default tags

    const competition = rows[0];

    const title = `${competition.title} | RingTone Riches`;
    const description =
      competition.description ||
      "Enter now for your chance to win! Limited tickets available.";
    const image = toAbsoluteImage(competition.imageUrl);
    const url = `${SITE_URL}/competition/${competitionId}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="RingTone Riches" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body></body>
</html>`;

    res.set("Content-Type", "text/html");
    return res.send(html);
  } catch (error) {
    console.error("socialPreviewMiddleware error:", error);
    return next();
  }
}