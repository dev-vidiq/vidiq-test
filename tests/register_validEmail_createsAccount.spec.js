// @ts-check
import { test, expect, devices } from '@playwright/test';
import { registerNewUser } from './helpers/auth.js';

test.use({ ...devices['Desktop Chrome'] });

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: `test-results/register_validEmail_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

/**
 * BLOCKED — reCAPTCHA bypass not configured for signup
 *
 * The dev bypass header (RECAPTCHA_BYPASS_HEADER_NAME / VALUE) is currently
 * only respected by the login endpoint. The signup endpoint validates the
 * reCAPTCHA token server-side, so headless Playwright cannot complete account
 * creation via the UI.
 *
 * ACTION REQUIRED (backend):
 *   Extend the dev bypass header to also skip reCAPTCHA validation on the
 *   signup/registration endpoint (same logic as login).
 *
 * Once that is done, remove the test.skip() line below.
 */
test('new user can register with a valid email and password', async ({ page }) => {
  test.skip(true, 'reCAPTCHA bypass not enabled for signup endpoint — see comment above');

  const { email } = await registerNewUser(page);

  // Account created — app navigates away from signup to the onboarding flow.
  // The exact first step depends on which A/B variant the new user is assigned to
  // (either /welcome tour or /onboarding/connect-channel), so we assert only that
  // we left signup and a Skip button is visible.
  await expect(page).not.toHaveURL(/signup/, { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible({ timeout: 10000 });

  await page.screenshot({ path: 'test-results/register_validEmail_success.png', fullPage: true });
});
