import { test, expect } from '@playwright/test';
import { forceControlVariant } from './helpers/experiments';
import { registerNewUser } from './helpers/auth';

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const safeName = testInfo.title.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    await page.screenshot({
      path: `test-results/register_${safeName}_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test.describe('Registration', () => {
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

    await expect(page).not.toHaveURL(/signup/, { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/register_validEmail_success.png', fullPage: true });
  });

  /**
   * BLOCKED — depends on two pending items:
   *   1. reCAPTCHA bypass not enabled for signup (see test above)
   *   2. Admin API credentials not yet configured (ADMIN_API_URL + ADMIN_API_TOKEN)
   *
   * ACTION REQUIRED:
   *   Add ADMIN_API_URL and ADMIN_API_TOKEN to .env and GitHub secrets.
   *   Remove test.skip() once both are resolved.
   */
  test('newly created account can be deleted via admin API', async ({ page, request }) => {
    test.skip(true, 'Blocked: signup reCAPTCHA bypass + admin API credentials needed');

    const adminApiUrl = process.env.ADMIN_API_URL;
    const adminApiToken = process.env.ADMIN_API_TOKEN;

    if (!adminApiUrl || !adminApiToken) {
      test.skip(true, 'ADMIN_API_URL and ADMIN_API_TOKEN are not set');
    }

    await forceControlVariant(page);

    const { email } = await registerNewUser(page);
    await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });
    await page.screenshot({ path: 'test-results/register_deleteAccount_registered.png', fullPage: true });

    // Look up the user ID by email via the admin API
    // TODO: replace with the real endpoint path once confirmed
    const lookupResponse = await request.get(
      `${adminApiUrl}/users?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${adminApiToken}` } }
    );
    expect(lookupResponse.ok()).toBeTruthy();

    const { id: userId } = await lookupResponse.json() as { id: string };
    expect(userId).toBeTruthy();

    // Delete the account
    // TODO: replace with the real endpoint path once confirmed
    const deleteResponse = await request.delete(`${adminApiUrl}/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminApiToken}` },
    });
    expect(deleteResponse.ok()).toBeTruthy();

    // Verify the account no longer exists
    const verifyResponse = await request.get(`${adminApiUrl}/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminApiToken}` },
    });
    expect(verifyResponse.status()).toBe(404);
  });
});
