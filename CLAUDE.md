# VidIQ QA Test Automation

## Project Overview

QA test automation project for the VidIQ web app.

- **App under test:** https://app.vidiq.com
- **Test framework:** Playwright with TypeScript
- **Browser:** Chromium only
- **Test files location:** `/tests` folder
- **Linear project:** https://linear.app/vidiq/team/E2E/all
- **Slack channel:** #ai-daily-test-runs-results
- **A/B testing platform:** Amplitude

---

## Conventions

### Language & Framework
- Always write tests in **TypeScript** (`.spec.ts`)
- Only use the Chromium browser
- Run `npm run type-check` after writing new files to catch type errors

### File Naming
- Group tests by domain — one file per feature area: `login.spec.ts`, `register.spec.ts`
- Helpers live in `tests/helpers/` as `.ts` files
- Visual regression tests live in `tests/visual/`

### Writing Tests
- Write clear test descriptions in plain English
- Use `test.describe('Feature', () => { ... })` to group related scenarios
- Always wait for elements properly — never use fixed delays (no `page.waitForTimeout()`)
- Always take screenshots on test failure (via `test.afterEach`)
- Always run tests after writing them

### Selector resilience (self-healing tests)
VidIQ does not use `data-testid` attributes. Tests locate elements the same way
a human (or browser agent) would — by what is visible on screen: role, label, or text.

Pick selectors in this order — top is most resilient, bottom is most fragile:

1. `getByRole('button', { name: 'Save' })` — best, mirrors how a person reads the UI
2. `getByLabel('Email address')` — great for form fields
3. `getByText('Keyword score')` — good for static visible copy
4. CSS class selectors — fragile, breaks on any style refactor, avoid
5. XPath — most fragile, never use

### A/B experiments
- Always call `forceControlVariant(page)` before `page.goto()` in every test
- This intercepts Amplitude Experiment and Flagr so tests always run on control
- Never rely on random variant assignment — tests must be deterministic

### Reusable helpers
- `tests/helpers/auth.ts` — `loginAsTestUser(page)` for any test needing a logged-in state
- `tests/helpers/recaptcha.ts` — `mockRecaptcha(page)` for any form that has reCAPTCHA
- `tests/helpers/experiments.ts` — `forceControlVariant(page)` before every page load

### Visual regression
- Visual tests live in `tests/visual/`
- Baseline PNGs live in `tests/visual/*.spec.ts-snapshots/` and are committed to git
- To update baselines after an intentional UI change: trigger the workflow manually
  and enable "Update visual snapshots" — it regenerates and auto-commits the baselines
- To mask dynamic content (counters, dates): pass `mask: [page.locator('...')]` to `toHaveScreenshot`

### Workflow
- When asked to write a new test, always ask to describe the expected behavior first before writing any code
- When a feature changes, update existing tests rather than creating new ones — avoid duplication
- After tests pass, summarize results in plain English (not technical language) so the summary can be shared directly with the team
