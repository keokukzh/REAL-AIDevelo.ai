import { test, expect } from '@playwright/test';

test('Retell page loads widget container', async ({ page }) => {
  await page.goto('/retell');
  // Wait a short time for widget script to inject container
  await page.waitForTimeout(500);
  const el = await page.$('#retell-widget');
  expect(el).not.toBeNull();
});
