import { test, expect } from '@playwright/test';

test('webdesign 3d click does not throw CSP/CORB errors', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', (msg) => {
    messages.push(`console:${msg.type()}:${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    messages.push(`pageerror:${err.message}`);
  });

  const BASE = process.env.BASE_URL || 'https://aidevelo.ai';
  await page.goto(`${BASE}/webdesign`, { waitUntil: 'networkidle' });

  // Wait a bit for three scene to initialize
  await page.waitForTimeout(1500);

  // Try to find a canvas and click in the center (avoid header intercepts)
  const canvas = await page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box not found');
  await canvas.click({ position: { x: Math.floor(box.width / 2), y: Math.floor(box.height / 2) }, timeout: 10000 });

  // Wait for any errors to appear
  await page.waitForTimeout(2000);

  // Log captured messages to stdout so the test output includes them
  console.log('Captured console messages:');
  messages.forEach((m) => console.log(m));

  // Fail if any CSP/CORB-related messages found
  const hasCsp = messages.some((m) => /Content Security Policy|CSP|blocked|CORB|cross-origin/i.test(m));
  expect(hasCsp).toBeFalsy();
});