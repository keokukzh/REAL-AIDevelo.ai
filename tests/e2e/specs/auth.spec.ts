import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/AuthPage';

test.describe('Auth flow', () => {
  test('renders login form and accepts input', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await page.getByLabel(/email/i).fill('user@example.com');

    const submit = page.getByRole('button', { name: /login|anmelden/i });
    await expect(submit).toBeVisible();
  });
});

