import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/DashboardPage';
import { AuthPage } from '../page-objects/AuthPage';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const auth = new AuthPage(page);
    await auth.goto();
    
    // Use dev quick login if available, otherwise perform normal login
    const quickLoginButton = page.getByRole('button', { name: /quick login|dev login/i });
    if (await quickLoginButton.isVisible().catch(() => false)) {
      await quickLoginButton.click();
      await page.waitForURL(/\/dashboard/);
    } else {
      // Normal login flow
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /login|anmelden/i }).click();
      await page.waitForURL(/\/dashboard/);
    }
  });

  test('should load dashboard and display status cards', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Check that dashboard loaded
    await expect(page.getByText(/dashboard|übersicht/i)).toBeVisible();

    // Check for status cards (Agent, Phone, Calendar, Calls)
    await expect(page.getByText(/agent|receptionist/i)).toBeVisible();
    await expect(page.getByText(/telefon|phone/i)).toBeVisible();
    await expect(page.getByText(/kalender|calendar/i)).toBeVisible();
    await expect(page.getByText(/anrufe|calls/i)).toBeVisible();
  });

  test('should display quick action buttons', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Check for quick action buttons
    await expect(page.getByRole('button', { name: /telefon verbinden|connect phone/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /kalender verbinden|connect calendar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /webhook status|webhook/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /calls ansehen|view calls/i })).toBeVisible();
  });

  test('should display recent calls table', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Check for recent calls section
    const recentCallsSection = page.getByText(/letzte anrufe|recent calls/i);
    await expect(recentCallsSection).toBeVisible();
  });

  test('should navigate to calls page when clicking view calls', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Click on "Calls ansehen" button
    await page.getByRole('button', { name: /calls ansehen|view calls/i }).click();
    
    // Should navigate to calls page
    await page.waitForURL(/\/calls/);
    await expect(page.getByText(/anrufe|calls/i)).toBeVisible();
  });
});
