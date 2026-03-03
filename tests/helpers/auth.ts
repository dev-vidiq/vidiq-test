import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { config } from 'dotenv';
import { mockRecaptcha } from './recaptcha';

config();

/**
 * Generates a unique test email for registration by appending a random number
 * to the base address. This ensures each test run creates a distinct account
 * and avoids collisions between parallel or repeated runs.
 *
 * All test accounts share the same inbox (anna.bekh@vid.io) via the + alias
 * convention, so no separate mailbox is needed.
 */
export function generateTestEmail(): string {
  const random = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
  return `anna.bekh+test${random}@vid.io`;
}

/**
 * Registers a brand-new user on the signup page and waits until the app
 * navigates away (to the onboarding flow). Returns the credentials used so
 * the caller can reference or clean up the account afterwards.
 *
 * The signup form is two-step:
 *   1. Enter email + password → click "Continue with email"
 *   2. Click "Create account"
 */
export async function registerNewUser(
  page: Page,
  email?: string,
  password?: string
): Promise<{ email: string; password: string }> {
  const testEmail = email ?? generateTestEmail();
  // Registration has stricter password requirements than login (uppercase + special chars).
  const testPassword = password ?? process.env.TEST_REGISTER_PASSWORD ?? 'TestPassword123!';

  // mockRecaptcha enables the "Create account" button (reCAPTCHA must complete
  // for it to become clickable). Requires the backend dev bypass header to
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
 * session.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
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

  // Wait until we leave the login page — the app is ready
  await expect(page).not.toHaveURL(/login/, { timeout: 20000 });
}
