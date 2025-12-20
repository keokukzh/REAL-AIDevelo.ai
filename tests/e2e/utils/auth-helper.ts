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
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // Wait for form to be ready
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

    // Find and fill email input
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]')).first();
    await emailInput.fill(email);

    // Find and fill password input
    const passwordInput = page.locator('input[type="password"]').or(page.locator('input[name="password"]')).first();
    await passwordInput.fill(password);

    // Find and click login button (wait for it to be enabled)
    const loginButton = page.getByRole('button', { name: /anmelden|login|sign in/i }).first();
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
    await loginButton.click();

    // Wait for navigation to dashboard
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 20000 });
      console.log('[Auth] Successfully authenticated');
      return true;
    } catch (e) {
      // Check if we're still on login page (login failed)
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.warn('[Auth] Login failed - still on login page');
        return false;
      }
      // Might have navigated somewhere else, check if dashboard
      if (currentUrl.includes('/dashboard')) {
        console.log('[Auth] Successfully authenticated');
        return true;
      }
      console.warn('[Auth] Unexpected navigation after login:', currentUrl);
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
