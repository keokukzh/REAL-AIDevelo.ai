import { Page, expect } from '@playwright/test';

export class AgentPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/agents');
  }

  async openCreateModal() {
    const createButton = this.page.getByRole('button', { name: /create agent|add agent|agent erstellen/i });
    await createButton.click();
  }

  async expectListVisible() {
    await expect(this.page.getByText(/agent/i)).toBeVisible();
  }
}

