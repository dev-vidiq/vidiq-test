// @ts-check

/**
 * Mocks reCAPTCHA for automated tests in headless environments.
 *
 * Two-layer approach to prevent the real reCAPTCHA script from interfering:
 * 1. Intercept the reCAPTCHA API script request and abort it so it never loads.
 * 2. Inject a window.grecaptcha stub via addInitScript using Object.defineProperty
 *    so that even if any inline script tries to overwrite it, the mock stays in place.
 *
 * Call this before page.goto() in any test that submits a form protected by reCAPTCHA.
 */
export async function mockRecaptcha(page) {
  await page.route(/google\.com\/recaptcha/, (route) => route.abort());

  await page.addInitScript(() => {
    const mock = {
      ready: (cb) => cb(),
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
