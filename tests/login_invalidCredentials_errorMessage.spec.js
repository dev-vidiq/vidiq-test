// @ts-check
import { test, expect, devices } from '@playwright/test';
import { config } from 'dotenv';

config();

const TEST_EMAIL = process.env.TEST_EMAIL;
const RECAPTCHA_BYPASS_HEADER_NAME = process.env.RECAPTCHA_BYPASS_HEADER_NAME;
const RECAPTCHA_BYPASS_HEADER_VALUE = process.env.RECAPTCHA_BYPASS_HEADER_VALUE;

const WRONG_PASSWORD = 'this-is-not-the-right-password';

test.use({
  ...devices['Desktop Chrome'],
  extraHTTPHeaders: {
    [RECAPTCHA_BYPASS_HEADER_NAME]: RECAPTCHA_BYPASS_HEADER_VALUE,
  },
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: `test-results/login_invalidCredentials_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test('user sees an error message when logging in with the wrong password', async ({ page }) => {
  await page.addInitScript(() => {
    window.grecaptcha = {
      ready: (cb) => cb(),
      execute: () => Promise.resolve('bypass-token'),
      render: () => 0,
      reset: () => {},
    };
  });

  await page.goto('https://app.vidiq.com/auth/login');

  await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
  await page.getByRole('textbox', { name: /password/i }).fill(WRONG_PASSWORD);
  await page.getByRole('button', { name: 'Continue with email' }).click();

  await expect(page.getByRole('button', { name: 'Log in to your account' })).toBeVisible();
  await page.getByRole('textbox', { name: /password/i }).fill(WRONG_PASSWORD);
  await page.getByRole('button', { name: 'Log in to your account' }).click();

  await expect(page.getByText(/incorrect credentials/i)).toBeVisible({ timeout: 10000 });

  await page.screenshot({ path: 'test-results/login_invalidCredentials_errorMessage.png', fullPage: true });
});
