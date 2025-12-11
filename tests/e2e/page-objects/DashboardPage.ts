import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(this.page.getByText(/dashboard/i)).toBeVisible();
  }

  async openAgentList() {
    const agentsTab = this.page.getByRole('link', { name: /agents|voice agent/i });
    await agentsTab.click();
  }
}

