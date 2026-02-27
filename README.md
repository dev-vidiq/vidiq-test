# VidIQ E2E Test Automation

End-to-end test automation suite for the [VidIQ](https://app.vidiq.com) web application.

## Tech Stack

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev) | Test framework and browser automation |
| JavaScript | Test language |
| Chromium | Browser (only) |
| [Cursor](https://cursor.com) | AI-assisted test authoring |
| [Linear](https://linear.app/vidiq/team/E2E/all) | Issue tracking and test planning |
| Slack — `#ai-daily-test-runs-results` | Test run reporting |
| GitHub Actions | CI/CD — runs on every PR and push to main |

## Project Structure

```
vidiq-tests/
├── tests/
│   ├── helpers/
│   │   ├── auth.js          # Reusable login helper
│   │   ├── recaptcha.js     # reCAPTCHA mock for form tests
│   │   └── experiments.js   # Forces A/B control variant
│   ├── visual/              # Visual regression tests + baselines
│   ├── login_*.spec.js      # Login feature tests
│   └── ...                  # Future feature tests
├── .env                     # Local credentials (never committed)
├── .env.example             # Template for local setup
├── playwright.config.js     # Playwright configuration
└── CLAUDE.md                # AI coding conventions
```

## Setup

**1. Clone the repo and install dependencies**

```bash
git clone https://github.com/dev-vidiq/vidiq-test.git
cd vidiq-test
npm install
```

**2. Install Playwright browsers**

```bash
npx playwright install chromium
```

**3. Set up environment variables**

```bash
cp .env.example .env
```

Then fill in your values:

| Variable | Description |
|---|---|
| `TEST_EMAIL` | Test account email |
| `TEST_PASSWORD` | Test account password |
| `RECAPTCHA_BYPASS_HEADER_NAME` | Header name for reCAPTCHA bypass |
| `RECAPTCHA_BYPASS_HEADER_VALUE` | Header value for reCAPTCHA bypass |

## Running Tests

**Run all tests**

```bash
npx playwright test --project=chromium
```

**Run a specific test file**

```bash
npx playwright test tests/login_validCredentials_success.spec.js --project=chromium
```

**Run all login tests**

```bash
npx playwright test tests/login_ --project=chromium
```

**Run only visual regression tests**

```bash
npx playwright test tests/visual/ --project=chromium
```

**Update visual baselines after an intentional UI change**

```bash
npx playwright test tests/visual/ --update-snapshots --project=chromium
```

Or trigger it from GitHub Actions (see CI section below) — it auto-commits the new baselines.

**View the HTML report after a run**

```bash
npx playwright show-report
```

## CI/CD

Tests run automatically on GitHub Actions:

| Trigger | When |
|---|---|
| Push to `main` | After every merge |
| Pull request | On every PR — must pass before merge |
| Manual | GitHub Actions → Run workflow → optional reason |

**Manual run with snapshot update:** GitHub Actions → **Run workflow** → enable **"Update visual snapshots"** — re-generates visual baselines and commits them automatically.

After every run, a Slack notification is posted to `#ai-daily-test-runs-results` with:
- Pass / fail status and test counts
- Names of any failed tests
- Direct download link for screenshots and videos of failures

## Test Coverage

### Login

| Test | Scenario | Status |
|---|---|---|
| `login_validCredentials_success.spec.js` | Valid email + password logs in and reaches the dashboard | ✅ Passing |
| `login_invalidCredentials_errorMessage.spec.js` | Wrong password shows "Incorrect credentials" error | ✅ Passing |
| `login_googleSSO_redirectsToGoogle.spec.js` | "Continue with Google" opens Google sign-in popup | ✅ Passing |
| `login_resetPassword_formWorks.spec.js` | Forgot password flow sends reset email and shows confirmation | ✅ Passing |

### Visual regression

| Test | What is checked | Status |
|---|---|---|
| `visual/login_page_matchesBaseline.spec.js` | Login page layout matches stored baseline | ✅ Passing |
| `visual/login_page_matchesBaseline.spec.js` | Login email-step layout matches stored baseline | ✅ Passing |

## Helpers

All helpers live in `tests/helpers/` and should be imported rather than duplicating logic in tests.

| Helper | Function | Use when |
|---|---|---|
| `auth.js` | `loginAsTestUser(page)` | Any test that needs an authenticated session |
| `recaptcha.js` | `mockRecaptcha(page)` | Any test that submits a form with reCAPTCHA |
| `experiments.js` | `forceControlVariant(page)` | Every test — forces A/B control variant before page load |

## Conventions

- Test files are named `feature_action_expected.spec.js`
- All tests run on Chromium only
- Screenshots and videos are saved automatically on test failure
- Credentials are always loaded from `.env` or GitHub secrets — never hardcoded
- See [CLAUDE.md](./CLAUDE.md) for full coding conventions
