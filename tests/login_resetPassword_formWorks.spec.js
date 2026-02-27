// @ts-check
import { test, expect, devices } from '@playwright/test';
import { mockRecaptcha } from './helpers/recaptcha.js';

const TEST_EMAIL = process.env.TEST_EMAIL;
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
      path: `test-results/login_resetPassword_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test('user can reach the reset password form and submit their email', async ({ page }) => {
  await mockRecaptcha(page);

  await page.goto('https://app.vidiq.com/auth/login');

  await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
  await page.getByRole('button', { name: 'Continue with email' }).click();

  await expect(page.getByText(/forgot your password/i)).toBeVisible();
  await page.getByRole('link', { name: 'here' }).click();

  await expect(page).toHaveURL(/forgot-password/, { timeout: 10000 });

  const emailField = page.getByRole('textbox', { name: /email/i });
  await expect(emailField).toBeVisible();

  await emailField.fill(TEST_EMAIL);
  await page.getByRole('button', { name: 'Request reset' }).click();

  await expect(page.getByText('Reset request sent')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/instructions on how to set a new password/i)).toBeVisible();

  await page.screenshot({ path: 'test-results/login_resetPassword_formWorks.png', fullPage: true });
});
