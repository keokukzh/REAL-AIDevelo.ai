import { chromium } from '@playwright/test';

async function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok || res.status === 200) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

(async () => {
  const url = 'http://localhost:4000';
  const ready = await waitForServer(url, 20000);
  if (!ready) {
    console.log(`SERVER UNREACHABLE: ${url}`);
    process.exit(2);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log(`CONSOLE ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    console.log(`PAGEERROR: ${err.message}\n${err.stack}`);
  });

  page.on('requestfailed', (req) => {
    console.log(`REQUESTFAILED: ${req.url()} ${req.failure()?.errorText}`);
  });

  try {
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('NAVIGATION ERROR:', e.message);
  }

  await browser.close();
})();
