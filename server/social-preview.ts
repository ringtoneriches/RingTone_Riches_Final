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

const DEFAULT_TITLE = "RingTone Riches";
const DEFAULT_DESCRIPTION =
  "Win big prizes with RingTone Riches competitions! Enter now for your chance to win.";
const DEFAULT_IMAGE_PATH = "/og-image.png";

const ASSET_EXTENSION =
  /\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|eot|map|js|css|json|xml|txt|webmanifest)$/i;

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

function getSiteUrl(req: Request): string {
  const proto = (
    (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ||
    req.protocol ||
    "https"
  ).trim();
  const host = (
    (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0] ||
    req.get("host") ||
    "ringtoneriches.co.uk"
  ).trim();
  return `${proto}://${host}`.replace(/\/$/, "");
}

function toAbsoluteImage(siteUrl: string, imageUrl: string | null): string {
  if (!imageUrl) return `${siteUrl}${DEFAULT_IMAGE_PATH}`;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${siteUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function renderOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
}): string {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const image = escapeHtml(opts.image);
  const url = escapeHtml(opts.url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta property="fb:app_id" content="488978370856533" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="RingTone Riches" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body></body>
</html>`;
}

function sendOg(res: Response, html: string) {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.set("Cache-Control", "public, max-age=0, must-revalidate");
  return res.send(html);
}

export async function socialPreviewMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userAgent = req.headers["user-agent"] || "";

  if (!isBot(userAgent)) return next();
  if (req.path.startsWith("/api")) return next();
  if (req.path.startsWith("/attached_assets")) return next();
  if (ASSET_EXTENSION.test(req.path)) return next();

  const siteUrl = getSiteUrl(req);
  const pageUrl = `${siteUrl}${req.originalUrl.split("?")[0] || "/"}`;
  const defaultImage = `${siteUrl}${DEFAULT_IMAGE_PATH}`;

  const match = req.path.match(/^\/competition\/([a-zA-Z0-9-]+)\/?$/);
  if (!match) {
    return sendOg(
      res,
      renderOgHtml({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        image: defaultImage,
        url: pageUrl,
      })
    );
  }

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

    if (!rows.length) {
      return sendOg(
        res,
        renderOgHtml({
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          image: defaultImage,
          url: pageUrl,
        })
      );
    }

    const competition = rows[0];
    const title = `${competition.title} | RingTone Riches`;
    const description =
      competition.description ||
      "Enter now for your chance to win! Limited tickets available.";

    return sendOg(
      res,
      renderOgHtml({
        title,
        description,
        image: toAbsoluteImage(siteUrl, competition.imageUrl),
        url: `${siteUrl}/competition/${competitionId}`,
      })
    );
  } catch (error) {
    console.error("socialPreviewMiddleware error:", error);
    return sendOg(
      res,
      renderOgHtml({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        image: defaultImage,
        url: pageUrl,
      })
    );
  }
}
