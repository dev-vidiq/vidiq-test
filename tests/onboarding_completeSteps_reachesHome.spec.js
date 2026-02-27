// @ts-check
import { test, expect, devices } from '@playwright/test';
import { registerNewUser } from './helpers/auth.js';

/**
 * Onboarding flow (fill path):
 *
 * Step 1 varies by A/B variant:
 *   Control   → /welcome  "Ask vidIQ anything!" tour → Skip (no form to fill)
 *   Treatment → /onboarding/connect-channel          → Skip (YouTube OAuth — cannot automate)
 *
 * Remaining steps are filled where possible:
 *   /sn-onboarding/topics/… → type a niche topic → Continue
 *   /onboarding              → pricing modal       → Escape to close
 *   /survey                  → select discovery source → Continue
 *   /feed                    → done
 */

test.use({ ...devices['Desktop Chrome'] });

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: `test-results/onboarding_completeSteps_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

/**
 * BLOCKED — depends on reCAPTCHA bypass for signup (see register_validEmail_createsAccount.spec.js).
 * Remove test.skip() once the backend extends the dev bypass to the signup endpoint.
 */
test('new user can fill onboarding steps and reach the home feed', async ({ page }) => {
  test.skip(true, 'Blocked: signup reCAPTCHA bypass needed — see register_validEmail_createsAccount.spec.js');

  await registerNewUser(page);

  // --- Step 1: First onboarding screen (A/B variant) ---
  // Control   → /welcome tour (no form to fill — Skip)
  // Treatment → /onboarding/connect-channel (YouTube OAuth — cannot automate, Skip)
  await expect(page).not.toHaveURL(/signup/, { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Skip' }).click();

  // --- Step 2: Topics — fill the niche field ---
  await expect(page).toHaveURL(/sn-onboarding\/topics/, { timeout: 10000 });
  await expect(page.getByText('What will you make videos about?')).toBeVisible();

  // The Continue button is disabled until text is entered
  const topicInput = page.getByRole('textbox', { name: /travel tips/i });
  await expect(topicInput).toBeVisible();
  await topicInput.fill('Gaming');

  const continueButton = page.getByRole('button', { name: 'Continue' });
  await expect(continueButton).toBeEnabled({ timeout: 5000 });
  await continueButton.click();

  // --- Step 3: Pricing modal ---
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 10000 });
  await page.keyboard.press('Escape');

  // --- Step 4: Discovery survey — select a source and submit ---
  await expect(page).toHaveURL(/survey/, { timeout: 10000 });
  await expect(page.getByText('How did you discover vidIQ?')).toBeVisible();

  await page.getByRole('radio', { name: 'Google Search' }).click();

  const surveyButton = page.getByRole('button', { name: 'Continue' });
  await expect(surveyButton).toBeEnabled({ timeout: 5000 });
  await surveyButton.click();

  // --- Done: home feed ---
  await expect(page).toHaveURL(/\/feed/, { timeout: 15000 });

  await page.screenshot({ path: 'test-results/onboarding_completeSteps_success.png', fullPage: true });
});
