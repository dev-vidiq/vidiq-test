// @ts-check
import { test, expect, devices } from '@playwright/test';
import { forceControlVariant } from './helpers/experiments.js';
import { registerNewUser } from './helpers/auth.js';

/**
 * PREREQUISITE — Admin API credentials
 *
 * Deleting a VidIQ account is not available in the product UI — it requires
 * an internal admin API call. This test needs two additional GitHub secrets
 * (and matching .env entries for local runs):
 *
 *   ADMIN_API_URL   — Base URL of the VidIQ admin API
 *                     e.g. https://admin-api.vidiq.com
 *   ADMIN_API_TOKEN — Bearer token with permission to delete accounts
 *
 * Once these are set, remove the test.skip() line below.
 */

test.use({ ...devices['Desktop Chrome'] });

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: `test-results/register_deleteAccount_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

/**
 * BLOCKED — depends on two pending items:
 *   1. reCAPTCHA bypass not enabled for signup (see register_validEmail_createsAccount.spec.js)
 *   2. Admin API credentials not yet configured (ADMIN_API_URL + ADMIN_API_TOKEN)
 * Remove test.skip() once both are resolved.
 */
test('newly created account can be deleted via admin API', async ({ page, request }) => {
  test.skip(true, 'Blocked: signup reCAPTCHA bypass + admin API credentials needed');
  const adminApiUrl = process.env.ADMIN_API_URL;
  const adminApiToken = process.env.ADMIN_API_TOKEN;

  if (!adminApiUrl || !adminApiToken) {
    test.skip(true, 'ADMIN_API_URL and ADMIN_API_TOKEN are not set — skipping delete test');
  }

  await forceControlVariant(page);

  // Step 1 — Register a fresh account to delete
  const { email } = await registerNewUser(page);
  await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });

  await page.screenshot({ path: 'test-results/register_deleteAccount_registered.png', fullPage: true });

  // Step 2 — Look up the user ID by email via the admin API
  // TODO: replace with the real endpoint path once confirmed
  const lookupResponse = await request.get(`${adminApiUrl}/users?email=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${adminApiToken}` },
  });
  expect(lookupResponse.ok()).toBeTruthy();

  const { id: userId } = await lookupResponse.json();
  expect(userId).toBeTruthy();

  // Step 3 — Delete the account
  // TODO: replace with the real endpoint path once confirmed
  const deleteResponse = await request.delete(`${adminApiUrl}/users/${userId}`, {
    headers: { Authorization: `Bearer ${adminApiToken}` },
  });
  expect(deleteResponse.ok()).toBeTruthy();

  // Step 4 — Verify the account no longer exists
  const verifyResponse = await request.get(`${adminApiUrl}/users/${userId}`, {
    headers: { Authorization: `Bearer ${adminApiToken}` },
  });
  expect(verifyResponse.status()).toBe(404);
});
