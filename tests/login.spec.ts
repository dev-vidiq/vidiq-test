import { test, expect } from '@playwright/test';
import { mockRecaptcha } from './helpers/recaptcha';

const TEST_EMAIL = process.env.TEST_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const WRONG_PASSWORD = 'this-is-not-the-right-password';

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const safeName = testInfo.title.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    await page.screenshot({
      path: `test-results/login_${safeName}_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test.describe('Login', () => {
  test('valid credentials reach the dashboard', async ({ page }) => {
    await mockRecaptcha(page);
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

  test('wrong password shows an error message', async ({ page }) => {
    await mockRecaptcha(page);
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

  test('Continue with Google redirects to Google sign-in', async ({ page }) => {
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

  test('password reset form accepts email and shows confirmation', async ({ page }) => {
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
});
