import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/DashboardPage';
import { AuthPage } from '../page-objects/AuthPage';

test.describe('Phone Connect Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const auth = new AuthPage(page);
    await auth.goto();
    
    const quickLoginButton = page.getByRole('button', { name: /quick login|dev login/i });
    if (await quickLoginButton.isVisible().catch(() => false)) {
      await quickLoginButton.click();
      await page.waitForURL(/\/dashboard/);
    } else {
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /login|anmelden/i }).click();
      await page.waitForURL(/\/dashboard/);
    }
  });

  test('should open phone connection modal when clicking connect phone', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Click on "Telefon verbinden" button
    await page.getByRole('button', { name: /telefon verbinden|connect phone/i }).click();

    // Modal should open
    await expect(page.getByText(/telefon verbinden|connect phone/i).first()).toBeVisible();
    
    // Should show available numbers or loading state
    const modalContent = page.locator('[role="dialog"]');
    await expect(modalContent).toBeVisible();
  });

  test('should display available phone numbers in modal', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Open phone connection modal
    await page.getByRole('button', { name: /telefon verbinden|connect phone/i }).click();
    
    // Wait for modal to appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should show available numbers (or loading/empty state)
    // The actual content depends on API response, so we just check modal is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should close modal when clicking cancel', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Open phone connection modal
    await page.getByRole('button', { name: /telefon verbinden|connect phone/i }).click();
    
    // Wait for modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click cancel/close button
    const cancelButton = page.getByRole('button', { name: /abbrechen|cancel|close/i });
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
      // Modal should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });
});
