// @ts-check
import { test, expect, devices } from '@playwright/test';
import { mockRecaptcha } from '../helpers/recaptcha.js';
import { forceControlVariant } from '../helpers/experiments.js';

/**
 * Visual regression tests for the login page.
 *
 * HOW BASELINES WORK:
 *   First run:  npx playwright test tests/visual/ --update-snapshots --project=chromium
 *               Playwright creates PNG baselines in tests/visual/__snapshots__/
 *               Commit those files to git — they are the source of truth.
 *
 *   Every subsequent run compares against those committed baselines.
 *   If the diff exceeds the threshold defined in playwright.config.js the test
 *   fails and a diff image is saved to test-results/ and uploaded as a CI
 *   artifact so you can see exactly what changed visually.
 *
 * UPDATING BASELINES (intentional UI change):
 *   Trigger the GitHub Actions workflow manually and enable
 *   "Update visual snapshots" — it re-generates baselines and commits them.
 *   Or run locally: npx playwright test tests/visual/ --update-snapshots --project=chromium
 */

test.use({ ...devices['Desktop Chrome'] });

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: `test-results/visual_${testInfo.title.replace(/\s+/g, '_')}_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test('login page matches visual baseline', async ({ page }) => {
  await forceControlVariant(page);
  await mockRecaptcha(page);

  await page.goto('https://app.vidiq.com/auth/login');

  // Wait for the email input to be visible — page is fully rendered
  await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

  // Compare the full page against the stored baseline screenshot.
  // Any change larger than the threshold in playwright.config.js will fail
  // the test and produce a diff image showing exactly what moved or changed.
  await expect(page).toHaveScreenshot('login-page.png', {
    fullPage: true,
    // Mask dynamic elements that change between runs (timestamps, banners, etc.)
    // Add more locators here as you discover dynamic content.
    mask: [],
  });
});

test('login page — email step matches visual baseline', async ({ page }) => {
  await forceControlVariant(page);
  await mockRecaptcha(page);

  await page.goto('https://app.vidiq.com/auth/login');

  await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
  await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
  await page.getByRole('button', { name: 'Continue with email' }).click();

  // Wait for the password step to render
  await expect(
    page.getByRole('button', { name: 'Log in to your account' })
  ).toBeVisible();

  await expect(page).toHaveScreenshot('login-page-email-step.png', {
    fullPage: true,
  });
});
