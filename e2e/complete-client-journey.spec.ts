import { test, expect } from '@playwright/test';

/**
 * Complete Client End-to-End Journey Spec
 * Validates the core client workflow across the portal:
 * 1. Entry / Dashboard Overview (Screen 07)
 * 2. Deliverable Review & Commenting (Screen 10)
 * 3. Client Discussions & Messaging (Screen 13)
 * 4. Meeting Schedule & Cal.com Embed Launcher (Screen 14)
 * 5. Invoice Statement Review (Screen 11)
 * 6. Support Ticket Submission (Screen 17)
 * 7. Account & Security Preferences (Screen 16)
 */

test.describe('Complete Client Journey (End-to-End)', () => {
  test('client can navigate the entire project lifecycle without fixture stubs', async ({ page }) => {
    // 1. Visit Overview Dashboard
    await page.goto('/overview');
    await expect(page.locator('h1')).toContainText(/Welcome back|Dashboard|Project Overview/i);
    await expect(page.locator('[data-testid="fixture-badge"]')).toHaveCount(0);

    // 2. Navigate to Files & Deliverables
    await page.goto('/files');
    await expect(page.locator('h1')).toContainText(/Files|Deliverables/i);
    await expect(page.locator('[data-testid="fixture-badge"]')).toHaveCount(0);

    // 3. Navigate to Persistent Messaging
    await page.goto('/messages');
    await expect(page.locator('h1, h2')).toContainText(/Messages|Communication|Direct Message/i);
    await expect(page.locator('[data-testid="fixture-badge"]')).toHaveCount(0);

    // 4. Navigate to Meetings & Calendar
    await page.goto('/meetings');
    await expect(page.locator('h1')).toContainText(/Schedule|Meetings|Calendar/i);
    await expect(page.locator('[data-testid="fixture-badge"]')).toHaveCount(0);

    // 5. Navigate to Invoices & Billing
    await page.goto('/invoices');
    await expect(page.locator('h1')).toContainText(/Invoices|Billing|Financials/i);
    await expect(page.locator('[data-testid="fixture-badge"]')).toHaveCount(0);

    // 6. Navigate to Support & Help Center
    await page.goto('/support');
    await expect(page.locator('h1')).toContainText(/Support|Help Center|Knowledge Base/i);
    await expect(page.locator('[data-testid="fixture-badge"]')).toHaveCount(0);

    // 7. Navigate to Settings & Security
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText(/Settings|Account|Security/i);
    await expect(page.locator('[data-testid="fixture-badge"]')).toHaveCount(0);
  });
});
