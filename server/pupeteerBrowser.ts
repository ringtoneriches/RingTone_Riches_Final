import puppeteer from 'puppeteer';

let browser: puppeteer.Browser | null = null;

export async function getBrowser(): Promise<puppeteer.Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
    console.log("Puppeteer browser launched");
  }
  return browser;
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
