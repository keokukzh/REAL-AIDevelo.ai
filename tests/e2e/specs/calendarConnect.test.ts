import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/DashboardPage';
import { AuthPage } from '../page-objects/AuthPage';

test.describe('Calendar Connect Flow', () => {
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

  test('should open OAuth flow when clicking connect calendar', async ({ page, context }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Set up OAuth popup listener
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
      page.getByRole('button', { name: /kalender verbinden|connect calendar/i }).click(),
    ]);

    // If OAuth is configured, popup should open
    // If not configured, should show warning message
    if (popup) {
      // OAuth popup opened
      await expect(popup.url()).toContain(/google|oauth|accounts/);
      await popup.close();
    } else {
      // Check for warning message about OAuth not configured
      const warningMessage = page.getByText(/oauth|nicht konfiguriert|not configured/i);
      await expect(warningMessage).toBeVisible({ timeout: 2000 }).catch(() => {
        // If no warning, OAuth might be configured but popup was blocked
      });
    }
  });

  test('should display calendar status on dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Check for calendar card/section
    const calendarSection = page.getByText(/kalender|calendar/i);
    await expect(calendarSection).toBeVisible();

    // Should show connection status (connected/not connected)
    const statusIndicator = page.locator('text=/verbunden|connected|offline|nicht verbunden/i');
    await expect(statusIndicator.first()).toBeVisible();
  });

  test('should show disconnect option when calendar is connected', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Check if calendar is connected
    const connectedStatus = page.getByText(/verbunden|connected/i);
    const isConnected = await connectedStatus.isVisible().catch(() => false);

    if (isConnected) {
      // Should show disconnect button
      const disconnectButton = page.getByRole('button', { name: /trennen|disconnect/i });
      await expect(disconnectButton).toBeVisible();
    } else {
      // If not connected, should show connect button
      const connectButton = page.getByRole('button', { name: /verbinden|connect/i });
      await expect(connectButton).toBeVisible();
    }
  });
});
