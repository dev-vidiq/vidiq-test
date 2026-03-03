import { test, expect } from '@playwright/test';
import { registerNewUser } from './helpers/auth';

/**
 * Onboarding flow — step sequence after registration:
 *
 * Step 1 varies by A/B variant:
 *   Control   → /welcome             "Ask vidIQ anything!" tour → Skip
 *   Treatment → /onboarding/connect-channel "Unlock your feed" → Skip
 *
 * Remaining steps are the same in both variants:
 *   /sn-onboarding/topics/… → Skip (or fill a topic)
 *   /onboarding              → pricing modal → Escape
 *   /survey                  → Skip for now (or select a source)
 *   /feed                    → done
 */

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const safeName = testInfo.title.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    await page.screenshot({
      path: `test-results/onboarding_${safeName}_failure_${testInfo.retry}.png`,
      fullPage: true,
    });
  }
});

test.describe('Onboarding', () => {
  /**
   * BLOCKED — depends on reCAPTCHA bypass for signup.
   * Remove test.skip() once the backend extends the dev bypass to the signup endpoint.
   * See tests/register.spec.ts for context.
   */
  test('new user can skip all steps and reach the home feed', async ({ page }) => {
    test.skip(true, 'Blocked: signup reCAPTCHA bypass needed — see register.spec.ts');

    await registerNewUser(page);

    // --- Step 1: First onboarding screen (A/B variant) ---
    await expect(page).not.toHaveURL(/signup/, { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Skip' }).click();

    // --- Step 2: Topics ---
    await expect(page).toHaveURL(/sn-onboarding\/topics/, { timeout: 10000 });
    await expect(page.getByText('What will you make videos about?')).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();

    // --- Step 3: Pricing modal ---
    await expect(page).toHaveURL(/\/onboarding$/, { timeout: 10000 });
    await page.keyboard.press('Escape');

    // --- Step 4: Discovery survey ---
    await expect(page).toHaveURL(/survey/, { timeout: 10000 });
    await expect(page.getByText('How did you discover vidIQ?')).toBeVisible();
    await page.getByRole('button', { name: 'Skip for now' }).click();

    await expect(page).toHaveURL(/\/feed/, { timeout: 15000 });
    await page.screenshot({ path: 'test-results/onboarding_skipAll_success.png', fullPage: true });
  });

  /**
   * BLOCKED — depends on reCAPTCHA bypass for signup.
   * Remove test.skip() once the backend extends the dev bypass to the signup endpoint.
   */
  test('new user can fill onboarding steps and reach the home feed', async ({ page }) => {
    test.skip(true, 'Blocked: signup reCAPTCHA bypass needed — see register.spec.ts');

    await registerNewUser(page);

    // --- Step 1: First onboarding screen (A/B variant) ---
    await expect(page).not.toHaveURL(/signup/, { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Skip' }).click();

    // --- Step 2: Topics — fill the niche field ---
    await expect(page).toHaveURL(/sn-onboarding\/topics/, { timeout: 10000 });
    await expect(page.getByText('What will you make videos about?')).toBeVisible();

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

    await expect(page).toHaveURL(/\/feed/, { timeout: 15000 });
    await page.screenshot({ path: 'test-results/onboarding_completeSteps_success.png', fullPage: true });
  });
});
