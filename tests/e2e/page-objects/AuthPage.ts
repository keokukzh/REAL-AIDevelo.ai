import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string) {
    const emailInput = this.page.getByLabel(/email/i);
    await emailInput.fill(email);
    const submit = this.page.getByRole('button', { name: /login|anmelden/i });
    await submit.click();
  }

  async expectLoggedIn() {
    await expect(this.page.getByText(/dashboard/i)).toBeVisible();
  }
}

