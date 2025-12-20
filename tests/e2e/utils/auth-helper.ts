import { Page, expect } from '@playwright/test';

/**
 * Default test credentials (can be overridden via env vars)
 */
const DEFAULT_TEST_EMAIL = 'keokukmusic@gmail.com';
const DEFAULT_TEST_PASSWORD = 'Kukukeku992';

/**
 * Authenticate user for dashboard access
 * Tries DevQuickLogin first, then falls back to credentials
 */
export async function authenticate(page: Page): Promise<boolean> {
  try {
    // Check for DevQuickLogin button first
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    const quickLoginButton = page.getByRole('button', { name: /quick login|dev login|🚀/i });
    const isQuickLoginVisible = await quickLoginButton.isVisible().catch(() => false);
    
    if (isQuickLoginVisible) {
      console.log('[Auth] Using DevQuickLogin bypass');
      await quickLoginButton.click();
      await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
      
      // Verify we're on dashboard
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        return true;
      }
    }

    // Fall back to credential-based login
    console.log('[Auth] Using credential-based login');
    const email = process.env.E2E_TEST_EMAIL || DEFAULT_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD || DEFAULT_TEST_PASSWORD;

    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Find email input
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    await emailInput.fill(email);

    // Find and click login button
    const loginButton = page.getByRole('button', { name: /login|anmelden|sign in/i }).first();
    await loginButton.click();

    // Wait for redirect to dashboard or error
    await page.waitForURL(/\/dashboard|\/login/, { timeout: 15000 });

    // Check if we're on dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('[Auth] Successfully authenticated');
      return true;
    } else {
      console.warn('[Auth] Login failed - still on login page');
      return false;
    }
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return false;
  }
}

/**
 * Check if user is already authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
    const currentUrl = page.url();
    return currentUrl.includes('/dashboard') && !currentUrl.includes('/login');
  } catch {
    return false;
  }
}
