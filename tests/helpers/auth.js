// @ts-check
import { expect } from '@playwright/test';
import { config } from 'dotenv';
import { mockRecaptcha } from './recaptcha.js';

config();

/**
 * Generates a unique test email for registration by appending a timestamp to
 * the base address. This ensures each test run creates a distinct account and
 * avoids collisions between parallel or repeated runs.
 *
 * All test accounts share the same inbox (anna.bekh@vid.io) via the + alias
 * convention, so no separate mailbox is needed.
 *
 * @returns {string}
 */
export function generateTestEmail() {
  // Use the same +test{number} format as existing VidIQ test accounts
  // (e.g. anna.bekh+test1000@vid.io) — the server may apply special handling
  // to this pattern for the dev reCAPTCHA bypass on signup.
  const random = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
  return `anna.bekh+test${random}@vid.io`;
}

/**
 * Registers a brand-new user on the signup page and waits until the app
 * navigates away (to the onboarding flow). Returns the email used so the
 * caller can reference or clean up the account afterwards.
 *
 * The signup form is two-step (same as login):
 *   1. Enter email + password → click "Continue with email"
 *   2. Click "Create account"
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} [email] — pass a specific email, or omit to auto-generate
 * @param {string} [password] — pass a specific password, or uses TEST_PASSWORD
 * @returns {Promise<{email: string, password: string}>}
 */
export async function registerNewUser(page, email, password) {
  const testEmail = email ?? generateTestEmail();
  // Registration has stricter password requirements than login (uppercase + special chars).
  // TEST_REGISTER_PASSWORD defaults to a safe value; TEST_PASSWORD is for login only.
  const testPassword = password ?? process.env.TEST_REGISTER_PASSWORD ?? 'TestPassword123!';

  // mockRecaptcha enables the "Create account" button (reCAPTCHA must complete
  // for it to become clickable). This requires the backend dev bypass header to
  // also be configured for the signup endpoint — currently only login supports it.
  await mockRecaptcha(page);
  await page.goto('https://app.vidiq.com/auth/signup');

  await page.getByRole('textbox', { name: /email/i }).fill(testEmail);
  await page.getByRole('textbox', { name: /password/i }).fill(testPassword);
  await page.getByRole('button', { name: 'Continue with email' }).click();

  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  await page.getByRole('button', { name: 'Create account' }).click();

  // Wait until we leave the signup page — onboarding starts
  await expect(page).not.toHaveURL(/signup/, { timeout: 15000 });

  return { email: testEmail, password: testPassword };
}

/**
 * Logs in as the test user and waits until the app navigates away from the
 * login page. Call this at the start of any test that requires an authenticated
 * session so you don't repeat the full login flow in every test file.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function loginAsTestUser(page) {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_EMAIL and TEST_PASSWORD must be set in .env or as GitHub secrets.'
    );
  }

  await mockRecaptcha(page);
  await page.goto('https://app.vidiq.com/auth/login');

  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: 'Continue with email' }).click();

  await expect(
    page.getByRole('button', { name: 'Log in to your account' })
  ).toBeVisible();

  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: 'Log in to your account' }).click();

  // Wait until we leave the login page — the app is ready to use
  await expect(page).not.toHaveURL(/login/, { timeout: 20000 });
}
