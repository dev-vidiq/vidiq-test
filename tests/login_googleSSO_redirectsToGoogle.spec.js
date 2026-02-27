// @ts-check
import { test, expect, devices } from '@playwright/test';
import { config } from 'dotenv';

config();

const RECAPTCHA_BYPASS_HEADER_NAME = process.env.RECAPTCHA_BYPASS_HEADER_NAME;
const RECAPTCHA_BYPASS_HEADER_VALUE = process.env.RECAPTCHA_BYPASS_HEADER_VALUE;

test.use({
  ...devices['Desktop Chrome'],
  extraHTTPHeaders: {
    [RECAPTCHA_BYPASS_HEADER_NAME]: RECAPTCHA_BYPASS_HEADER_VALUE,
  },
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: `test-results/login_googleSSO_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test('clicking Continue with Google redirects to Google sign-in', async ({ page }) => {
  await page.goto('https://app.vidiq.com/auth/login');

  const googleButton = page.getByRole('button', { name: 'Continue with Google' });
  await expect(googleButton).toBeVisible();

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 15000 }),
    googleButton.click(),
  ]);

  await popup.waitForLoadState();
  await expect(popup).toHaveURL(/accounts\.google\.com/);

  await popup.screenshot({ path: 'test-results/login_googleSSO_redirectsToGoogle.png', fullPage: true });
});
