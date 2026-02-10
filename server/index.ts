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
import puppeteer from "puppeteer";
import { startCrons } from "./cron";
import { getBrowser } from "./pupeteerBrowser";
  dotenv.config();



const app = express();
app.disable("etag"); 
setupCustomAuth(app)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files from attached_assets directory
app.use("/attached_assets", express.static("attached_assets"));


app.get('/api/facebook-members', async (req, res) => {
let browser;
  try {
    browser = await getBrowser();
    
    const page = await browser.newPage();
    
    // Minimal headers
    await page.setUserAgent('Mozilla/5.0');
    
    // Go to the page
    await page.goto('https://www.facebook.com/groups/1358608295902979', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // Wait for the specific element with known classes
    try {
      await page.waitForSelector('div.x1i10hfl.xjbqb8w', { timeout: 5000 });
    } catch (e) {
      // If selector not found, continue anyway
    }
    
    // Extract text from page
    const pageText = await page.evaluate(() => {
      return document.body.innerText || document.body.textContent || '';
    });
    
    await page.close();
    
    // Search for member count in the extracted text
    const match = pageText.match(/([\d,\.]+[KkM]?)\s*members/i);
    
    if (match) {
      const countStr = match[1];
      let totalMembers = 6700;
      
      if (countStr.includes('K') || countStr.includes('k')) {
        totalMembers = parseFloat(countStr.replace(',', '')) * 1000;
      } else if (countStr.includes('M') || countStr.includes('m')) {
        totalMembers = parseFloat(countStr.replace(',', '')) * 1000000;
      } else {
        totalMembers = parseInt(countStr.replace(/,/g, ''));
      }
      
      res.json({
        totalMembers: Math.round(totalMembers),
        formattedCount: formatCount(totalMembers),
        success: true
      });
    } else {
      // Fallback
      res.json({
        totalMembers: 6900,
        formattedCount: '7.3K',
        isFallback: true,
        success: true
      });
    }
    
  } catch (err) {
    console.error('Facebook error:', err.message);
    
    res.json({
      totalMembers: 6700,
      formattedCount: '6.7K',
      isFallback: true,
      success: false
    });
  }
});

function formatCount(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}
// app.get('/api/trustpilot-reviews', async (req, res) => {
//   try {
//     const { data } = await axios.get('https://www.trustpilot.com/review/ringtoneriches.co.uk');
//     const $ = load(data);
//  // Get total reviews
//     const totalReviewsText = $('[data-reviews-count-typography]').first().text().trim();
//     const averageRating = $('p[data-rating-typography="true"]').first().text().trim() || 'N/A';

//     const reviews: any[] = [];
//     $('[data-testid="service-review-card-v2"]').each((_, el) => {
//       const name = $(el).find('[data-consumer-name-typography]').text().trim();
//       const ratingAlt = $(el).find('img.CDS_StarRating_starRating__614d2e').attr('alt') || '';
//       const rating = ratingAlt.match(/\d+/)?.[0] || '';
//       const title = $(el).find('[data-service-review-title-typography]').text().trim();
//       const text = $(el).find('[data-service-review-text-typography]').text().trim();
//       const date = $(el).find('[data-testid="review-badge-date"] span').text().trim();
//       reviews.push({ name, rating, title, text, date});
//     });

//      res.json({ totalReviews: totalReviewsText, averageRating, reviews: reviews});
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch reviews' });
//   }
// });


app.get("/api/trustpilot-reviews", async (req, res) => {
let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.goto(
      "https://www.trustpilot.com/review/ringtoneriches.co.uk?sort=recency",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    // Wait for reviews to load
    await page.waitForSelector('[data-testid="service-review-card-v2"]', {
      timeout: 15000,
    });

    const data = await page.evaluate(() => {
      const reviews = [...document.querySelectorAll('[data-testid="service-review-card-v2"]')].map(el => ({
        name: el.querySelector('[data-consumer-name-typography]')?.textContent?.trim() || "Anonymous",
        title: el.querySelector('[data-service-review-title-typography]')?.textContent?.trim() || "",
        text: el.querySelector('[data-service-review-text-typography]')?.textContent?.trim() || "",
        date: el.querySelector("time")?.getAttribute("datetime") ||
        el.querySelector('[data-testid="review-badge-date"]')?.textContent?.trim() ||
        "",
        rating:
          el.querySelector("img[alt*='Rated']")?.getAttribute("alt")?.match(/\d+/)?.[0] || "0",
      }));

      const totalReviews =
        document.querySelector('[data-reviews-count-typography]')?.textContent?.trim() || "0";

      const averageRating =
        document.querySelector('p[data-rating-typography="true"]')?.textContent?.trim() || "N/A";

      return { reviews, totalReviews, averageRating };
    });
    await page.close(); 
    res.json(data);
  } catch (err) {
    console.error("Trustpilot scrape error:", err);
    res.status(500).json({ error: "Failed to fetch Trustpilot reviews" });
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
