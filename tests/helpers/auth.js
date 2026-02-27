// @ts-check
import { expect } from '@playwright/test';
import { config } from 'dotenv';
import { mockRecaptcha } from './recaptcha.js';

config();

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
