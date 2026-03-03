import type { Page } from '@playwright/test';
import { config } from 'dotenv';

// Load .env in the worker process. dotenv does not propagate vars set in the
// main process across Playwright's fork boundary, so each worker must load its
// own copy. In CI there is no .env file — this is a no-op and GitHub Actions
// secrets are already present as native env vars.
config();

/**
 * Mocks reCAPTCHA for automated tests in headless environments.
 *
 * Two-layer approach to prevent the real reCAPTCHA script from interfering:
 * 1. Intercept the reCAPTCHA API script request and fulfill it with an empty
 *    200 response. This is safer than abort() — aborting causes a hard network
 *    error that makes pages stall waiting for reCAPTCHA to initialise.
 * 2. Inject a window.grecaptcha stub via addInitScript using Object.defineProperty
 *    so that even if any inline script tries to overwrite it, the mock stays in place.
 *
 * Call this before page.goto() in any test that submits a form protected by reCAPTCHA.
 */
export async function mockRecaptcha(page: Page): Promise<void> {
  await page.route(/google\.com\/recaptcha/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: '',
    })
  );

  await page.addInitScript(() => {
    const mock = {
      ready: (cb?: () => void) => { if (cb) cb(); },
      execute: () => Promise.resolve('bypass-token'),
      render: () => 0,
      reset: () => {},
    };
    Object.defineProperty(window, 'grecaptcha', {
      get: () => mock,
      set: () => {},
      configurable: false,
    });
  });
}
