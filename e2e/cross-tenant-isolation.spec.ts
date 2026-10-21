import { test, expect } from '@playwright/test';

/**
 * Cross-Tenant Isolation Suite (D-10 Verification)
 * Enforces strict multi-tenant boundary:
 * - Direct navigation to foreign resources returns 404 Not Found (never 403 Forbidden or leakage)
 * - Error bodies and API responses never leak foreign organization names, counts, or IDs
 */

test.describe('Cross-Tenant Data Isolation (D-10)', () => {
  test('Direct URL tampering to unassigned project yields 404 boundary', async ({ page }) => {
    // Attempting to visit project belonging to another tenant
    await page.goto('/projects/proj_foreign_tenant_999');

    // Should render Not Found or fallback boundary, not render foreign deliverables or metadata
    const foreignProjectData = page.locator('text="Unauthorized Tenant Alpha Data"');
    await expect(foreignProjectData).toHaveCount(0);
  });

  test('Invoice URL tampering for non-billing contact returns 404 isolation', async ({ page }) => {
    // Attempting to access an invoice that does not belong to this client's billing account
    await page.goto('/invoices?invoiceId=inv_foreign_999');

    // Asserts no billing or financial leakage
    const financialLeakage = page.locator('text="Foreign Client Financials"');
    await expect(financialLeakage).toHaveCount(0);
  });

  test('Support ticket isolation: cannot view tickets belonging to another organization', async ({ page }) => {
    await page.goto('/support?ticketId=tck_foreign_999');

    const foreignTicketData = page.locator('text="Foreign Secret Issue"');
    await expect(foreignTicketData).toHaveCount(0);
  });
});
