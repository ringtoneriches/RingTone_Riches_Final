import puppeteer from 'puppeteer-core';
import { Browser } from 'puppeteer-core';

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    // Find Chrome installation path
    const chromePath = getChromePath();
    
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
    console.log("Puppeteer browser launched with Chrome at:", chromePath);
  }
  return browser;
}

// Helper function to find Chrome path on different OS
function getChromePath(): string {
  // Windows paths
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\AL MUDASIR\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    // Add the path where Puppeteer downloaded Chrome (if it exists)
    'C:\\Users\\AL MUDASIR\\.cache\\puppeteer\\chrome-headless-shell\\win64-145.0.7632.76\\chrome-headless-shell.exe'
  ];

  for (const path of possiblePaths) {
    const fs = require('fs');
    if (fs.existsSync(path)) {
      return path;
    }
  }

  throw new Error('Chrome not found. Please install Chrome or specify the correct path.');
}

// Optional: Close browser gracefully on server exit
process.on("exit", async () => {
  if (browser) {
    await browser.close();
    console.log("Puppeteer browser closed on exit");
  }
});

process.on("SIGINT", async () => {
  if (browser) {
    await browser.close();
    console.log("Puppeteer browser closed on SIGINT");
  }
  process.exit();
});

process.on("SIGTERM", async () => {
  if (browser) {
    await browser.close();
    console.log("Puppeteer browser closed on SIGTERM");
  }
  process.exit();
});