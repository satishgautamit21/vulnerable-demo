# AI Upgrade Agent

This folder contains the core automation logic for the dependency remediation agent used by this application.
The goal is to automatically identify vulnerable npm packages, recommend safe upgrade targets using an AI-assisted analysis, apply upgrades, validate the application, and roll back any failed changes.

## What this application is trying to achieve

- Detect vulnerabilities from `npm audit` output.
- Choose safe, stable upgrade versions for vulnerable packages.
- Apply upgrades one package at a time.
- Validate the application with tests and build.
- Roll back upgrades that cause failures.
- Repeat until vulnerabilities are resolved or no further safe upgrades are possible.

This is not just a batch upgrade script: it is an AI-assisted remediation workflow that balances vulnerability fixes with stability and validation.

## Agent file overview

### `index.js`

- Main orchestrator for the agent.
- Generates a fresh audit report.
- Reads remaining vulnerabilities.
- For each vulnerable package, calls `analyzePackage()` to get a recommended target version.
- Applies upgrades via `upgrader.js`.
- Validates the application via `validator.js`.
- Rolls back failed upgrades using `rollback.js`.
- Repeats attempts up to a maximum number of times.

### `analyzer.js`

- Reads `audit-report.json` and `package.json`.
- Extracts fixable vulnerabilities and relevant package metadata.
- Builds a prompt for the AI model.
- Uses `openai/gpt-oss-20b:free` through OpenRouter to choose the best upgrade target.
- Returns a JSON recommendation with `package`, `targetVersion`, `risk`, and `reason`.

### `audit.js`

- Runs `npm audit --json > audit-report.json`.
- Creates or refreshes the vulnerability report used by the agent.
- Uses a non-zero exit code from `npm audit` as expected when vulnerabilities exist.

### `upgrader.js`

- Performs the actual dependency upgrade using `npm install package@version`.
- Returns `true` on success and `false` on failure.

### `validator.js`

- Validates the application after each upgrade.
- Runs `npm test` and `npm run build`.
- Returns success or failure to decide whether the upgrade should stand.

### `rollback.js`

- Manages git-based rollback support.
- Creates a snapshot via `git stash push --include-untracked` before potentially destructive operations.
- Restores the snapshot with `git stash pop` when validation fails.
- Can also discard a snapshot if needed.

### `versionResolver.js`

- Queries npm for package versions using `npm view <package> versions --json`.
- Filters out prerelease versions.
- Provides:
  - `getAvailableVersions(packageName)`
  - `getLatestVersion(packageName)`
  - `getPreviousVersions(packageName, limit)`

## Workflow summary

1. `index.js` starts the agent.
2. `audit.js` generates a fresh audit report.
3. `analyzer.js` reads vulnerabilities and candidate package data.
4. For each fixable vulnerable package:
   - Call the AI analysis prompt.
   - Select a stable upgrade version.
   - Run `upgrader.js` to install it.
   - Run `validator.js` to ensure tests and build still pass.
   - If validation fails, use `rollback.js` to restore the previous state.
5. After each successful upgrade, refresh the audit report and repeat.
6. Stop when no vulnerabilities remain or no further safe upgrades can be found.

## Environment notes

- Requires `OPENROUTER_API_KEY` in environment variables.
- Requires a git repository for rollback support.
- Requires a working npm-based project with test and build scripts.

## Why this structure exists

- `index.js` keeps orchestration separate from implementation details.
- `analyzer.js` encapsulates AI reasoning and audit parsing.
- `upgrader.js`, `validator.js`, and `rollback.js` each handle one operation cleanly.
- `versionResolver.js` centralizes npm version lookups and avoids duplicate logic.

This folder is designed to be easy to understand, extend, and maintain while supporting an automated remediation workflow that is cautious, repeatable, and validation-driven.
