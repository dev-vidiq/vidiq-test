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
| Slack — `#ai-daily-test-runs-results` | Daily test run reporting |

## Project Structure

```
vidiq-tests/
├── tests/                  # All test files
├── .env                    # Local credentials (never committed)
├── playwright.config.js    # Playwright configuration
└── CLAUDE.md               # AI coding conventions
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

Copy the `.env` template and fill in your values:

```bash
cp .env.example .env
```

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

**View the HTML report after a run**

```bash
npx playwright show-report
```

## Test Coverage

### Login Feature

| Test File | Scenario | Status |
|---|---|---|
| `login_validCredentials_success.spec.js` | Valid email and password logs user in and reaches dashboard | ✅ Passing |
| `login_invalidCredentials_errorMessage.spec.js` | Wrong password shows "Incorrect credentials" error | ✅ Passing |
| `login_googleSSO_redirectsToGoogle.spec.js` | "Continue with Google" opens Google sign-in popup | ✅ Passing |
| `login_resetPassword_formWorks.spec.js` | Forgot password flow sends reset email and shows confirmation | ✅ Passing |

## Conventions

- Test files are named `feature_action_expected.spec.js`
- All tests run on Chromium only
- Screenshots are taken automatically on test failure
- Credentials are always loaded from `.env` — never hardcoded
- See [CLAUDE.md](./CLAUDE.md) for full coding conventions
