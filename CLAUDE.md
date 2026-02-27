# VidIQ QA Test Automation

## Project Overview

QA test automation project for the VidIQ web app.

- **App under test:** https://app.vidiq.com
- **Test framework:** Playwright with JavaScript
- **Browser:** Chromium only
- **Test files location:** `/tests` folder
- **Linear project:** https://linear.app/vidiq/team/E2E/all
- **Slack channel:** #ai-daily-test-runs-results
- **A/B testing platform:** Amplitude

---

## Conventions

### Language & Framework
- Always write tests in JavaScript (never TypeScript)
- Only use the Chromium browser

### File Naming
- Test files must follow this pattern: `feature_action_expected.spec.js`
- Examples: `search_query_returnsResults.spec.js`, `login_invalidPassword_showsError.spec.js`

### Writing Tests
- Write clear test descriptions in plain English
- Always wait for elements properly — never use fixed delays (no `page.waitForTimeout()`)
- Always take screenshots on test failure
- Always run tests after writing them

### Selector resilience (self-healing tests)
Pick selectors in this order — top is most resilient, bottom is most fragile:

1. `getByRole('button', { name: 'Save' })` — best, survives CSS/markup rewrites
2. `getByLabel('Email address')` — great for form fields
3. `getByText('Keyword score')` — good for static copy
4. `getByTestId('kw-score-widget')` — good when devs add `data-testid` attributes
5. CSS class selectors — fragile, breaks on any style refactor
6. XPath — most fragile, never use

**VidIQ does not use `data-testid` yet.** Use `getByRole` and `getByText` exclusively
until devs start adding `data-testid`. When requesting new attributes from devs,
ask for: `data-testid="<feature>-<element>"` e.g. `data-testid="keyword-search-input"`.

### A/B experiments
- Always call `forceControlVariant(page)` before `page.goto()` in every test
- This intercepts Amplitude Experiment and Flagr so tests always run on control
- Never rely on random variant assignment — tests must be deterministic

### Reusable helpers
- `tests/helpers/auth.js` — `loginAsTestUser(page)` for any test needing a logged-in state
- `tests/helpers/recaptcha.js` — `mockRecaptcha(page)` for any form that has reCAPTCHA
- `tests/helpers/experiments.js` — `forceControlVariant(page)` before every page load

### Visual regression
- Visual tests live in `tests/visual/`
- Baseline PNGs live in `tests/visual/__snapshots__/` and are committed to git
- To update baselines after an intentional UI change: trigger the workflow manually
  and enable "Update visual snapshots" — it regenerates and auto-commits the baselines
- To mask dynamic content (counters, dates): pass `mask: [page.locator('...')]` to `toHaveScreenshot`

### Workflow
- When asked to write a new test, always ask to describe the expected behavior first before writing any code
- When a feature changes, update existing tests rather than creating new ones — avoid duplication
- After tests pass, summarize results in plain English (not technical language) so the summary can be shared directly with the team
