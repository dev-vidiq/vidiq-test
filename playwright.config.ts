import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// Load .env for the main Playwright process (used to build extraHTTPHeaders below).
// Each test worker also calls config() independently via tests/helpers/recaptcha.ts
// because dotenv does not propagate vars to forked worker processes.
config();

const bypassHeaderName = process.env.RECAPTCHA_BYPASS_HEADER_NAME;
const bypassHeaderValue = process.env.RECAPTCHA_BYPASS_HEADER_VALUE;

// HTTP/2 requires lowercase header names. Normalise here so tests never hit
// "Invalid header name" errors in headless Chromium on Linux CI.
const extraHTTPHeaders: Record<string, string> =
  bypassHeaderName && bypassHeaderValue
    ? { [bypassHeaderName.toLowerCase()]: bypassHeaderValue }
    : {};

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Visual regression tolerance — allows up to 2% of pixels to differ and a
  // per-pixel colour delta of 0.2 (0–1 scale). Accounts for sub-pixel
  // rendering differences between machines without hiding real regressions.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
    },
  },
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    extraHTTPHeaders,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
