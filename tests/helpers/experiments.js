// @ts-check

/**
 * Forces all A/B experiments to return the control variant before the page
 * loads. Call this before page.goto() in every test so results never depend
 * on which bucket the test user is randomly assigned to.
 *
 * Works by intercepting two things at the network level:
 *   1. Amplitude Experiment — the SDK's flag-fetch endpoint
 *   2. Flagr — the evaluation/batch endpoint (if VidIQ uses a self-hosted instance)
 *
 * Returning an empty payload means "no treatments assigned" which is
 * equivalent to the control variant for every flag.
 *
 * HOW TO FIND THE REAL ENDPOINTS:
 *   Open DevTools → Network tab → filter by "vardata" or "evaluation" or "flagr"
 *   while loading app.vidiq.com. Copy the exact request URL and update the
 *   patterns below to match.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function forceControlVariant(page) {
  // --- Amplitude Experiment -------------------------------------------------
  // The JS SDK fetches all flag assignments on page load. Intercepting this
  // and returning {} means every flag resolves to its default (control) value.
  await page.route(
    /amplitude\.com\/(sdk|api)\/.*(vardata|flags|variants)/,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        // Empty object = no assignments = control for every flag
        body: JSON.stringify({}),
      })
  );

  // --- Flagr ----------------------------------------------------------------
  // Flagr evaluation returns an array of flag results. Returning an empty
  // evaluationResults array means no flag is enabled (control for all).
  await page.route(/\/api\/v1\/evaluation/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ evaluationResults: [] }),
    })
  );

  // --- Amplitude Analytics (optional) --------------------------------------
  // Block analytics events so test actions don't pollute production data.
  // Remove this block if you need analytics to fire during tests.
  await page.route(/api\.amplitude\.com\/2\/httpapi/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"code":200}' })
  );
}
