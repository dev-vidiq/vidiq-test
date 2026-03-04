# VidIQ Production Smoke Tests

## Purpose

This repo is a **production smoke monitor** for `app.vidiq.com`.

It runs a small set of critical tests after every deploy to confirm production is healthy.
Results are posted to **#ai-daily-test-runs-results** on Slack.

**New feature tests belong in `vid-io/webapp`** — see `playwright/tests/logged-out/` there.
This repo only contains tests that verify production is alive post-deploy.

- **App under test:** https://app.vidiq.com
- **Test framework:** Playwright with TypeScript
- **Browser:** Chromium only
- **CI:** Runs on push to `main` and on PRs in this repo
- **Slack channel:** #ai-daily-test-runs-results

---

## What's tested here

| File | Tests | Purpose |
|---|---|---|
| `tests/login.spec.ts` | Valid login, invalid login, Google SSO, password reset | Confirms production auth is working |

---

## Conventions

### Language & Framework
- Always write tests in **TypeScript** (`.spec.ts`)
- Only use the Chromium browser
- Run `npm run type-check` after writing new files

### Writing tests
- Each test must be independently runnable — no shared state between tests
- Always wait for elements properly — never use fixed delays (`page.waitForTimeout()`)
- Failure screenshots are captured automatically via `test.afterEach`

### Selector resilience
VidIQ production does not expose `data-testid` attributes. Use semantic selectors:

1. `getByRole('button', { name: 'Save' })` — best
2. `getByLabel('Email address')` — great for form fields
3. `getByText('Keyword score')` — good for static copy
4. CSS class selectors — avoid (breaks on style refactors)
5. XPath — never use

### Helpers
- `tests/helpers/auth.ts` — `loginAsTestUser(page)` for authenticated-state tests
- `tests/helpers/recaptcha.ts` — `mockRecaptcha(page)` for reCAPTCHA-protected forms
- `tests/helpers/experiments.ts` — `forceControlVariant(page)` to pin A/B tests to control

### Feature ranking script
Run `npm run rank-features` to query Amplitude and get a ranked list of features by user activity.
Use this to decide which features to prioritise for new E2E tests.

Requires credentials in `.env`:
- `AMPLITUDE_API_KEY` — Amplitude → Settings → Projects → your project → API Key
- `AMPLITUDE_SECRET_KEY` — same location, Secret Key

Optional: `AMPLITUDE_DAYS=30` (default) to change the look-back window.

### Visual regression
Visual regression belongs in `vid-io/webapp`, not here.
If you need a screenshot on failure, use `page.screenshot()` in `test.afterEach`.
