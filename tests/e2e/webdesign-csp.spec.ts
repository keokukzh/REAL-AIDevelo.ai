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

  // Try clicking by dispatching native mouse events to avoid pointer interception by header overlays
  const clientX = Math.floor(box.x + box.width / 2);
  const clientY = Math.floor(box.y + box.height * 0.7);
  await page.evaluate(({ x, y }) => {
    const elAtPoint = document.elementFromPoint(x, y);
    if (!elAtPoint) throw new Error('No element at click point');
    ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click'].forEach((type) => {
      elAtPoint.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    });
  }, { x: clientX, y: clientY });

  // Wait for any errors to appear
  await page.waitForTimeout(2000);

  // Log captured messages to stdout so the test output includes them
  console.log('Captured console messages:');
  messages.forEach((m) => console.log(m));

  // Fail if any CSP/CORB-related messages found
  const hasCsp = messages.some((m) => /Content Security Policy|CSP|blocked|CORB|cross-origin/i.test(m));
  expect(hasCsp).toBeFalsy();
});