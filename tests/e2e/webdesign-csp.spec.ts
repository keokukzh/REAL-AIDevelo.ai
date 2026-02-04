import { test, expect } from '@playwright/test';

test('webdesign 3d click does not throw CSP/CORB errors', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', (msg) => {
    messages.push(`console:${msg.type()}:${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    messages.push(`pageerror:${err.message}`);
  });

  await page.goto('http://localhost:4000/webdesign', { waitUntil: 'networkidle' });

  // Wait a bit for three scene to initialize
  await page.waitForTimeout(1500);

  // Try to find a canvas and click in the center
  const canvas = await page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 5000 });
  await canvas.click({ position: { x: 50, y: 50 } });

  // Wait for any errors to appear
  await page.waitForTimeout(1500);

  // Log captured messages to stdout so the test output includes them
  console.log('Captured console messages:');
  messages.forEach((m) => console.log(m));

  // Fail if any CSP/CORB-related messages found
  const hasCsp = messages.some((m) => /Content Security Policy|CSP|blocked|CORB|cross-origin/i.test(m));
  expect(hasCsp).toBeFalsy();
});