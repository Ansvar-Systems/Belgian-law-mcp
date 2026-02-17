# Belgian Law MCP Server

Production-grade MCP server for Belgian legislation with a read-only SQLite backend, contract tests, drift detection anchors, and deployment automation.

## What It Provides

- Full-text legal search over Belgian provisions (`FTS5` + BM25 ranking)
- Provision retrieval by statute and article reference
- Citation parsing, formatting, and validation for Belgian citation forms
- Currency checks (current + as-of-date support)
- EU cross-reference tooling (basis, implementations, provision mapping, compliance checks)
- Metadata/provenance introspection via `about`

## Current Dataset (Bundled)

- Legal documents: ~5,775
- Legal provisions: ~142,743
- Primary source: Justel
- Jurisdiction: Belgium (FR/NL)

## Quick Start

### Local stdio

```bash
npm ci
npm run build
npm start
```

Or run directly in development mode:

```bash
npm run dev
```

### HTTP / Vercel

- MCP endpoint: `/mcp`
- Health endpoint: `/health`
- Version endpoint: `/version`

`vercel.json` rewrites:

- `/mcp` -> `/api/mcp`
- `/health` -> `/api/health`
- `/version` -> `/api/health?version`

## Available Tools

- `search_legislation`
- `get_provision`
- `validate_citation`
- `build_legal_stance`
- `format_citation`
- `check_currency`
- `get_eu_basis`
- `get_belgian_implementations`
- `search_eu_implementations`
- `get_provision_eu_basis`
- `validate_eu_compliance`
- `about`

## Environment Variables

- `BELGIAN_LAW_DB_PATH` - Optional override for database file path
- `MAX_DB_AGE_DAYS` - Optional freshness threshold for `check-updates` (default `30`)
- `UPDATE_CHECK_YEARS` - Optional number of years checked by `check-updates` (default `2`)

## Build, Test, and Quality Gates

### Build

```bash
npm run build
```

### Full test suite (unit + integration + contract)

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

### Contract tests only

```bash
npm run test:contract
```

Nightly contract mode (enables network assertions):

```bash
CONTRACT_MODE=nightly npm run test:contract
```

## Golden Tests and Drift Detection

### Contract fixture file

- `fixtures/golden-tests.json`

### Drift anchor file

- `fixtures/golden-hashes.json`

### Run drift detection

```bash
npm run drift:detect
```

Notes:

- Entries with `expected_sha256 = COMPUTE_ON_FIRST_RUN` are intentionally skipped.
- Populate hashes before enforcing drift alerts in production.

## Data Freshness and Auto-Updates

### Check for source updates

```bash
npm run check-updates
```

Exit codes:

- `0`: No updates detected
- `1`: Updates detected
- `2`: Source/check errors

### Manual refresh flow

```bash
npm run ingest -- --year-start 2025 --year-end 2026 --phase all --lang both
npm run build:db
npm test
```

## Deployment (Vercel)

### Required secrets for GitHub Actions deployment workflow

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Local Vercel CLI flow

```bash
npx vercel pull --yes --environment=preview
npx vercel build
npx vercel deploy --prebuilt
```

Production:

```bash
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

## GitHub Automation Included

- `CI` (`.github/workflows/ci.yml`)
- `Drift Detection` (`.github/workflows/drift-detect.yml`)
- `Daily Data Freshness Check + Optional Auto-Update PR` (`.github/workflows/check-updates.yml`)
- `Vercel Deployment` (`.github/workflows/vercel-deploy.yml`)
- `Publish Package` (`.github/workflows/publish.yml`)
- `Dependabot` (`.github/dependabot.yml`)

## Source Attribution and Legal Notice

- Legal text is derived from Belgian Justel open data and related official legal sources.
- This project does not provide legal advice.
- For legal certainty, verify against official publications.

## License

Apache-2.0
