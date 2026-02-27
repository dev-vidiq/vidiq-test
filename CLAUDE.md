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

### Workflow
- When asked to write a new test, always ask to describe the expected behavior first before writing any code
- When a feature changes, update existing tests rather than creating new ones — avoid duplication
- After tests pass, summarize results in plain English (not technical language) so the summary can be shared directly with the team
