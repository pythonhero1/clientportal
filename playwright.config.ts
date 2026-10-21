import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Multi-Viewport & Multi-Theme Matrix Configuration
 * Covers all 4 required viewports:
 * - 390px (Mobile portrait)
 * - 768px (Tablet portrait)
 * - 1024px (Tablet landscape / Small laptop)
 * - 1440px (Desktop)
 * And both Dark and Light color schemes.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // 1. Mobile (390 x 844) - Dark & Light
    {
      name: 'Mobile (390px) Dark',
      use: {
        viewport: { width: 390, height: 844 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'Mobile (390px) Light',
      use: {
        viewport: { width: 390, height: 844 },
        colorScheme: 'light',
      },
    },

    // 2. Tablet (768 x 1024) - Dark & Light
    {
      name: 'Tablet (768px) Dark',
      use: {
        viewport: { width: 768, height: 1024 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'Tablet (768px) Light',
      use: {
        viewport: { width: 768, height: 1024 },
        colorScheme: 'light',
      },
    },

    // 3. Small Laptop / Tablet Landscape (1024 x 768) - Dark & Light
    {
      name: 'Desktop (1024px) Dark',
      use: {
        viewport: { width: 1024, height: 768 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'Desktop (1024px) Light',
      use: {
        viewport: { width: 1024, height: 768 },
        colorScheme: 'light',
      },
    },

    // 4. Large Desktop (1440 x 900) - Dark & Light
    {
      name: 'Desktop (1440px) Dark',
      use: {
        viewport: { width: 1440, height: 900 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'Desktop (1440px) Light',
      use: {
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
      },
    },
  ],
  webServer: {
    command: 'npm run preview --workspace @os-portal/web -- --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
