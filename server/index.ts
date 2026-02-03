import express, { type Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getSession, setupCustomAuth } from "./customAuth"; 
import { storage } from "./storage";
import { wsManager } from "./websocket";
import { autoSeedProduction } from "./auto-seed";
import { autoCreateAdmin } from "./auto-admin";
import axios from 'axios';
import { load } from 'cheerio';
import { startCrons } from "./cron";
  dotenv.config();



const app = express();
app.disable("etag"); 
setupCustomAuth(app)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files from attached_assets directory
app.use("/attached_assets", express.static("attached_assets"));

app.get('/api/facebook-members', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.facebook.com/groups/1358608295902979', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    // Try to find the member count in the HTML using regex
    const regex = /(\d+\.?\d*[KkM]?)\s*(?:<!-- -->)?\s*members/i;
    const match = data.match(regex);
    
    let totalMembers = 0;
    
    if (match && match[1]) {
      const countStr = match[1];
      if (countStr.includes('K') || countStr.includes('k')) {
        totalMembers = parseFloat(countStr) * 1000;
      } else if (countStr.includes('M') || countStr.includes('m')) {
        totalMembers = parseFloat(countStr) * 1000000;
      } else {
        totalMembers = parseInt(countStr.replace(/,/g, ''));
      }
    } else {
      // Try another common pattern
      const regex2 = /"(\d+\.?\d*[KkM]?) members"/i;
      const match2 = data.match(regex2);
      if (match2 && match2[1]) {
        const countStr = match2[1];
        if (countStr.includes('K') || countStr.includes('k')) {
          totalMembers = parseFloat(countStr) * 1000;
        }
      }
    }

    res.json({ 
      totalMembers: Math.round(totalMembers) || 6600,
      success: totalMembers > 0
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch members count',
      totalMembers: 6600, // Return fallback value
      success: false
    });
  }
});
app.get('/api/trustpilot-reviews', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.trustpilot.com/review/ringtoneriches.co.uk');
    const $ = load(data);
 // Get total reviews
    const totalReviewsText = $('[data-reviews-count-typography]').first().text().trim();
    const averageRating = $('span.CDS_Typography_display-m__dd9b51').first().text().trim() || 'N/A';

    const reviews: any[] = [];
    $('[data-testid="service-review-card-v2"]').each((_, el) => {
      const name = $(el).find('[data-consumer-name-typography]').text().trim();
      const ratingAlt = $(el).find('img.CDS_StarRating_starRating__614d2e').attr('alt') || '';
      const rating = ratingAlt.match(/\d+/)?.[0] || '';
      const title = $(el).find('[data-service-review-title-typography]').text().trim();
      const text = $(el).find('[data-service-review-text-typography]').text().trim();
      const date = $(el).find('[data-testid="review-badge-date"] span').text().trim();
      reviews.push({ name, rating, title, text, date});
    });

     res.json({ totalReviews: totalReviewsText, averageRating, reviews: reviews});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  console.log("➡️ Incoming request:", req.method, req.path);
  next();
});

(async () => {
  storage.initializeAdminUser();
  await autoSeedProduction();
  await autoCreateAdmin();
  const server = await registerRoutes(app);

  startCrons();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err); 
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Initialize WebSocket server (temporarily disabled for troubleshooting)
  // wsManager.initialize(server);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`🚀 serving on http://localhost:${port}`);
  });
})();
