# Changelog

All notable changes to the Belgian Law MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-22 - Golden Standard Release

### Added

#### Golden Standard Compliance
- **SECURITY.md** — vulnerability reporting policy, 6-layer scanner documentation
- **DISCLAIMER.md** — legal disclaimer for Belgian legislation, professional use warnings
- **PRIVACY.md** — client confidentiality guide, deployment privacy options
- **CODE_OF_CONDUCT.md** — Contributor Covenant 2.0
- **CONTRIBUTING.md** — development workflow, branching strategy, code style
- **CODEOWNERS** — engineering team ownership
- **CHANGELOG.md** — Keep a Changelog format
- **REGISTRY.md** — npm registry metadata, discovery tags
- **data/census.json** — jurisdiction census (5,775 laws, 142,743 provisions)

#### Security CI Workflows
- Updated `security.yml` to cover `dev` branch (CodeQL, Semgrep, Trivy, Gitleaks, Scorecard)
- Updated `ci.yml` to cover `dev` branch

#### Data Coverage
- **5,775 legal documents** from Justel (Belgian Official Journal)
- **142,743 legal provisions** with full-text search (FTS5 + BM25)
- **Bilingual support** — French (FR) and Dutch (NL)
- **EU cross-references** — directives and regulations linked to Belgian implementations
- **15 MCP tools** for legal research, citation validation, and EU compliance checking

#### MCP Tools (15)
1. `search_legislation` — Full-text search across Belgian statutes
2. `get_provision` — Retrieve specific provision by document ID and article reference
3. `validate_citation` — Verify citation format and existence
4. `build_legal_stance` — Multi-source legal position aggregation
5. `format_citation` — Belgian legal citation formatting
6. `check_currency` — Check if law is current/in force
7. `get_eu_basis` — Find EU directives that a Belgian law implements
8. `get_belgian_implementations` — Find Belgian laws implementing an EU act
9. `search_eu_implementations` — Search EU documents with Belgian implementation stats
10. `get_provision_eu_basis` — Get EU references for a specific provision
11. `validate_eu_compliance` — EU compliance checking
12. `list_sources` — Data source provenance and coverage metadata
13. `search_case_law` — Case law search
14. `get_definitions` — Legal term definitions
15. `about` — Server metadata, dataset statistics, and provenance

#### Infrastructure
- Vercel Streamable HTTP deployment (Strategy A — bundled SQLite)
- npm package: `@ansvar/belgian-law-mcp` (stdio transport)
- Golden contract tests with drift detection
- Daily data freshness checks with auto-update PR workflow
- Dependabot for npm and GitHub Actions dependencies

### Data Sources & Attribution
- **Justel** — Belgian Official Journal consolidated legislation (government open data)
- **EUR-Lex** — EU directive/regulation metadata (official EU database)

---

## [Unreleased]

_No unreleased changes._

---

## Version History Summary

| Version | Date | Key Changes |
|---------|------|-------------|
| **1.0.0** | 2026-02-22 | Golden standard release (15 tools, 5,775 laws, 142,743 provisions) |

---

## Attribution

### Data Sources

#### Belgian Legislation
- **Source:** Justel / Belgisch Staatsblad / Moniteur belge
- **License:** Belgian government open data
- **Languages:** French (FR), Dutch (NL)

#### EU Cross-References
- **Source:** EUR-Lex
- **License:** EU official open data
- **Coverage:** Directives and regulations linked to Belgian implementations

---

## License

Apache 2.0 — see [LICENSE](LICENSE)

Data licenses vary by source (see Attribution above).

---

**Maintained by:** [Ansvar Systems AB](https://ansvar.ai)
**Repository:** https://github.com/Ansvar-Systems/Belgium-law-mcp
**Support:** hello@ansvar.ai
