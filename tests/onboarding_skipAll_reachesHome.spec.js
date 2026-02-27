// @ts-check
import { test, expect, devices } from '@playwright/test';
import { registerNewUser } from './helpers/auth.js';

/**
 * Onboarding flow (skip path):
 *
 * Step 1 varies by A/B variant:
 *   Control   → /welcome             "Ask vidIQ anything!" tour → Skip
 *   Treatment → /onboarding/connect-channel "Unlock your feed"  → Skip
 *
 * Remaining steps are the same in both variants:
 *   /sn-onboarding/topics/… → Skip
 *   /onboarding              → pricing modal → Escape
 *   /survey                  → Skip for now
 *   /feed                    → done
 */

test.use({ ...devices['Desktop Chrome'] });

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: `test-results/onboarding_skipAll_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

/**
 * BLOCKED — depends on reCAPTCHA bypass for signup (see register_validEmail_createsAccount.spec.js).
 * Remove test.skip() once the backend extends the dev bypass to the signup endpoint.
 */
test('new user can skip all onboarding steps and reach the home feed', async ({ page }) => {
  test.skip(true, 'Blocked: signup reCAPTCHA bypass needed — see register_validEmail_createsAccount.spec.js');

  await registerNewUser(page);

  // --- Step 1: First onboarding screen (A/B variant) ---
  // Control   → /welcome with animated tour ("Ask vidIQ anything!")
  // Treatment → /onboarding/connect-channel with YouTube channel prompt
  // Both show a Skip button — click whichever appears first.
  await expect(page).not.toHaveURL(/signup/, { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Skip' }).click();

  // --- Step 2: Topics ---
  await expect(page).toHaveURL(/sn-onboarding\/topics/, { timeout: 10000 });
  await expect(page.getByText('What will you make videos about?')).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();

  // --- Step 3: Pricing modal ---
  // The modal appears on /onboarding — dismiss it with Escape
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 10000 });
  await page.keyboard.press('Escape');

  // --- Step 4: Discovery survey ---
  await expect(page).toHaveURL(/survey/, { timeout: 10000 });
  await expect(page.getByText('How did you discover vidIQ?')).toBeVisible();
  await page.getByRole('button', { name: 'Skip for now' }).click();

  // --- Done: home feed ---
  await expect(page).toHaveURL(/\/feed/, { timeout: 15000 });

  await page.screenshot({ path: 'test-results/onboarding_skipAll_success.png', fullPage: true });
});
