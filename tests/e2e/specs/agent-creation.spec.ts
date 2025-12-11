import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/DashboardPage';
import { AgentPage } from '../page-objects/AgentPage';

test.describe('Agent management', () => {
  test('navigates to agent list', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const agents = new AgentPage(page);

    await dashboard.goto();
    await dashboard.expectLoaded();

    await dashboard.openAgentList();
    await agents.expectListVisible();
  });
});

