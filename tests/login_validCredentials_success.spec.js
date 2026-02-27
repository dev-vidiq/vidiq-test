// @ts-check
import { test, expect, devices } from '@playwright/test';
import { config } from 'dotenv';

config();

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
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
      path: `test-results/login_validCredentials_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test('user can log in with valid credentials and reach the dashboard', async ({ page }) => {
  await page.addInitScript(() => {
    window.grecaptcha = {
      ready: (cb) => cb(),
      execute: () => Promise.resolve('bypass-token'),
      render: () => 0,
      reset: () => {},
    };
  });

  await page.goto('https://app.vidiq.com/auth/login');

  await expect(page).toHaveURL(/login/);

  await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
  await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);

  await page.getByRole('button', { name: 'Continue with email' }).click();

  await expect(page.getByRole('button', { name: 'Log in to your account' })).toBeVisible();
  await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Log in to your account' }).click();

  await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

  await page.screenshot({ path: 'test-results/login_validCredentials_success.png', fullPage: true });
});
