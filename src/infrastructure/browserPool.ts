import puppeteer, { Browser } from "puppeteer";

let browser: Browser | null = null;
export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({ headless: true });
    process.on("exit", () => browser?.close());
  }
  return browser;
}
