import { test, expect } from '@playwright/test';

test.describe('Voice agent experience', () => {
  test('shows hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Voice Agent/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Onboarding|Start/i })).toBeVisible();
  });
});

