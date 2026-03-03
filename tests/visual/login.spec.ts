import { test, expect } from '@playwright/test';
import { mockRecaptcha } from '../helpers/recaptcha';
import { forceControlVariant } from '../helpers/experiments';

/**
 * Visual regression tests for the login page.
 *
 * HOW BASELINES WORK:
 *   First run:  npx playwright test tests/visual/ --update-snapshots --project=chromium
 *               Playwright creates PNG baselines in tests/visual/login.spec.ts-snapshots/
 *               Commit those files to git — they are the source of truth.
 *
 *   Every subsequent run compares against those committed baselines.
 *   If the diff exceeds the threshold defined in playwright.config.ts the test
 *   fails and a diff image is saved to test-results/ and uploaded as a CI
 *   artifact so you can see exactly what changed visually.
 *
 * UPDATING BASELINES (intentional UI change):
 *   Trigger the GitHub Actions workflow manually and enable
 *   "Update visual snapshots" — it re-generates baselines and commits them.
 *   Or run locally: npx playwright test tests/visual/ --update-snapshots --project=chromium
 */

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const safeName = testInfo.title.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    await page.screenshot({
      path: `test-results/visual_${safeName}_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test.describe('Login page visual regression', () => {
  test('login page matches visual baseline', async ({ page }) => {
    await forceControlVariant(page);
    await mockRecaptcha(page);

    await page.goto('https://app.vidiq.com/auth/login');
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      // Add locators here to mask dynamic elements (timestamps, banners, etc.)
      mask: [],
    });
  });

  test('email step matches visual baseline', async ({ page }) => {
    await forceControlVariant(page);
    await mockRecaptcha(page);

    await page.goto('https://app.vidiq.com/auth/login');
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByRole('button', { name: 'Continue with email' }).click();

    await expect(
      page.getByRole('button', { name: 'Log in to your account' })
    ).toBeVisible();

    await expect(page).toHaveScreenshot('login-page-email-step.png', { fullPage: true });
  });
});
