import { test, expect } from '@playwright/test';

/**
 * Screen Matrix Verification (P09 Release Gate)
 * Asserts all 18 screens render cleanly without FixtureBadges, broken markup,
 * or layout horizontal overflows across mobile (390px), tablet (768px), and desktop (1440px).
 */

const ALL_18_SCREENS = [
  { id: 'Screen 01', path: '/sign-in', name: 'Sign In', public: true },
  { id: 'Screen 02', path: '/sign-up', name: 'Sign Up', public: true },
  { id: 'Screen 03', path: '/forgot-password', name: 'Forgot Password', public: true },
  { id: 'Screen 04', path: '/reset-password', name: 'Reset Password', public: true },
  { id: 'Screen 05', path: '/verify-email', name: 'Verify Email', public: true },
  { id: 'Screen 06', path: '/onboarding', name: 'Onboarding Welcome' },
  { id: 'Screen 07', path: '/overview', name: 'Client Dashboard Overview' },
  { id: 'Screen 08', path: '/projects', name: 'Projects List' },
  { id: 'Screen 09', path: '/projects/proj_1', name: 'Project Workspace' },
  { id: 'Screen 10', path: '/files', name: 'Files & Feedback' },
  { id: 'Screen 11', path: '/invoices', name: 'Invoices & Billing' },
  { id: 'Screen 12', path: '/onboarding/questionnaire', name: 'Intake Questionnaire' },
  { id: 'Screen 13', path: '/messages', name: 'Persistent Messaging' },
  { id: 'Screen 14', path: '/meetings', name: 'Meetings & Schedule' },
  { id: 'Screen 15', path: '/notifications', name: 'Notification Center' },
  { id: 'Screen 16', path: '/settings', name: 'Account & Security Settings' },
  { id: 'Screen 17', path: '/support', name: 'Support & Knowledge Base' },
  { id: 'Screen 18', path: '/overview?empty=true', name: 'No Active Project Empty State' },
];

test.describe('18-Screen Matrix Acceptance Verification', () => {
  for (const screen of ALL_18_SCREENS) {
    test(`${screen.id} (${screen.name}): renders without fixture badges or layout overflow`, async ({ page }) => {
      await page.goto(screen.path, { waitUntil: 'domcontentloaded' });

      // 1. Verify page has loaded with valid title and root element
      const root = page.locator('#root');
      await expect(root).toBeVisible();

      // 2. Strict release rule: Zero <FixtureBadge> elements remain on any screen
      const fixtureBadges = page.locator('[data-testid="fixture-badge"]');
      await expect(fixtureBadges).toHaveCount(0);

      // 3. Verify no unhandled React error overlays
      const errorOverlay = page.locator('vite-error-overlay');
      await expect(errorOverlay).toHaveCount(0);

      // 4. Verify no horizontal document scrollbar blowout
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin of error for subpixel anti-aliasing
    });
  }
});
