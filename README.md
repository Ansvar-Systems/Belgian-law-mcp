# Belgian Law MCP Server

**The Belgian Official Gazette (Belgisch Staatsblad / Moniteur belge) alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fbelgian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/belgian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Belgium-law-mcp?style=social)](https://github.com/Ansvar-Systems/Belgium-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Belgium-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Belgium-law-mcp/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/Belgium-law-mcp/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/Belgium-law-mcp/actions/workflows/check-updates.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](docs/EU_INTEGRATION_GUIDE.md)
[![Provisions](https://img.shields.io/badge/provisions-142%2C743-blue)](docs/EU_INTEGRATION_GUIDE.md)

Query **5,775 Belgian statutes** -- from the loi du 30 juillet 2018 (protection des données) and Code pénal to the Code civil, Code des sociétés et des associations, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Belgian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Belgian legal research means navigating the bilingual Belgisch Staatsblad / Moniteur belge, reconciling French and Dutch texts, and manually cross-referencing between federal, regional, and community law. Belgium also hosts the EU's primary institutions -- making Belgian law particularly relevant for EU regulatory compliance work. Whether you're:

- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking GDPR implementation or Loi anti-blanchiment requirements
- A **legal tech developer** building tools on Belgian or EU institutional law
- A **researcher** tracing EU institutional decisions back to Belgian implementation

...you shouldn't need dozens of browser tabs and multilingual PDF cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Belgian law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://belgian-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add belgian-law --transport http https://belgian-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "belgian-law": {
      "type": "url",
      "url": "https://belgian-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "belgian-law": {
      "type": "http",
      "url": "https://belgian-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/belgian-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "belgian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/belgian-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "belgian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/belgian-law-mcp"]
    }
  }
}
```

## Example Queries

Once connected, just ask naturally -- in French, Dutch, or English:

**French:**
- *"Que dit la loi du 30 juillet 2018 sur la protection des données (article 5) ?"*
- *"Recherche des dispositions sur la 'protection des données' dans le droit belge"*
- *"Quelles directives européennes la loi du 30 juillet 2018 met-elle en œuvre ?"*
- *"Trouvez les sanctions pénales dans le Code pénal pour fraude informatique"*
- *"Qu'est-ce que le Code des sociétés et des associations dit sur la responsabilité des administrateurs ?"*

**Dutch:**
- *"Wat zegt de wet van 30 juli 2018 over toestemming voor gegevensverwerking?"*
- *"Zoek naar 'gegevensbescherming' in het Belgische recht"*
- *"Welke Belgische wetten implementeren de AVG (GDPR)?"*

**English:**
- *"Which Belgian laws implement the GDPR?"*
- *"Compare NIS2 implementation requirements across Belgian statutes"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Statutes** | 5,775 statutes | Comprehensive Belgian federal legislation |
| **Provisions** | 142,743 sections | Full-text searchable with FTS5 |
| **Agency Guidance** | 10 documents | GBA/APD regulatory guidance (Premium) |
| **Database Size** | ~126 MB | Optimized SQLite, portable |
| **Daily Updates** | Automated | Freshness checks against Belgisch Staatsblad |

**Verified data only** -- every citation is validated against official sources (ejustice.just.fgov.be). Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from the Belgisch Staatsblad / Moniteur belge (ejustice.just.fgov.be)
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains regulation text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by publication date + article number
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
ejustice.just.fgov.be → Parse → SQLite → FTS5 snippet() → MCP response
                          ↑                      ↑
                   Provision parser       Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search Belgisch Staatsblad by date | Search by plain French/Dutch: *"protection des données"* |
| Navigate multilingual statute texts manually | Get the exact provision with context |
| Manual cross-referencing between laws | `build_legal_stance` aggregates across sources |
| "Is this statute still in force?" → check manually | `check_currency` tool → answer in seconds |
| Find EU basis → dig through EUR-Lex | `get_eu_basis` → linked EU directives instantly |
| Check ejustice for updates | Daily automated freshness checks |
| No API, no integration | MCP protocol → AI-native |

**Traditional:** Search ejustice → Navigate HTML → Ctrl+F → Cross-reference French/Dutch texts → Check EUR-Lex → Repeat

**This MCP:** *"Quelles obligations la loi du 30 juillet 2018 impose-t-elle et quelle directive EU la sous-tend ?"* → Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 search on 142,743 provisions with BM25 ranking |
| `get_provision` | Retrieve specific provision by statute identifier + article |
| `validate_citation` | Validate citation against database (zero-hallucination check) |
| `build_legal_stance` | Aggregate citations from statutes and agency guidance |
| `format_citation` | Format citations per Belgian conventions (full/short/pinpoint) |
| `check_currency` | Check if statute is in force, amended, or repealed |
| `list_sources` | List all available statutes with metadata and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### EU Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations for Belgian statute |
| `get_belgian_implementations` | Find Belgian laws implementing EU act |
| `search_eu_implementations` | Search EU documents with Belgian implementation counts |
| `get_provision_eu_basis` | Get EU law references for specific provision |
| `validate_eu_compliance` | Check implementation status (requires EU MCP) |

---

## EU Law Integration

Belgium is an EU member state and the home of the European Commission, European Council, and most EU agencies. Belgian law is uniquely positioned at the intersection of EU institutional decision-making and national transposition.

| Metric | Value |
|--------|-------|
| **EU Member Since** | 1957 (founding member) |
| **GDPR Implementation** | Loi du 30 juillet 2018 |
| **NIS2 Implementation** | Loi du 26 avril 2024 (cybersécurité) |
| **Data Authority (FR)** | Autorité de protection des données (APD) |
| **Data Authority (NL)** | Gegevensbeschermingsautoriteit (GBA) |
| **EUR-Lex Integration** | Automated metadata fetching |

### Key Belgian EU Implementations

- **GDPR** (2016/679) → Loi du 30 juillet 2018 relative à la protection des personnes physiques
- **NIS2 Directive** (2022/2555) → Loi du 26 avril 2024 (NIS2 transposition)
- **AI Act** (2024/1689) → Belgian implementation in progress
- **eIDAS** (910/2014) → Loi du 21 juillet 2016 (signatures électroniques)
- **AML Directive** (2015/849) → Loi du 18 septembre 2017 (anti-blanchiment)
- **Consumer Rights Directive** (2011/83) → Code de droit économique, Livre VI

> **Note on language:** Belgian law is officially trilingual. The database includes both French and Dutch texts for federal statutes. German-language texts (for the German-speaking Community) are not included in the current release.

See [EU_INTEGRATION_GUIDE.md](docs/EU_INTEGRATION_GUIDE.md) for detailed documentation.

---

## Data Sources & Freshness

All content is sourced from authoritative Belgian legal databases:

- **[ejustice.just.fgov.be](https://www.ejustice.just.fgov.be/)** -- Official Belgian law database (Justice)
- **[belgisch-staatsblad.be](https://www.belgisch-staatsblad.be/)** -- Belgisch Staatsblad / Moniteur belge
- **[EUR-Lex](https://eur-lex.europa.eu/)** -- Official EU law database (metadata only)

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Service public fédéral Justice / Federale Overheidsdienst Justitie |
| **Retrieval method** | ejustice.just.fgov.be HTML parse |
| **Languages** | French and Dutch (both official federal languages) |
| **License** | Belgian public data (open government) |
| **Coverage** | 5,775 federal statutes |
| **Last ingested** | 2026-02-25 |

### Automated Freshness Checks (Daily)

A [daily GitHub Actions workflow](.github/workflows/check-updates.yml) monitors all data sources:

| Source | Check | Method |
|--------|-------|--------|
| **Statute amendments** | ejustice API date comparison | All 5,775 statutes checked |
| **New statutes** | Belgisch Staatsblad publication feed | Diffed against database |
| **EU reference staleness** | Git commit timestamps | Flagged if >90 days old |

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Docker Security** | Container image scanning + SBOM generation | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **OSSF Scorecard** | OpenSSF best practices scoring | Weekly |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official ejustice.just.fgov.be publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is limited** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **EU cross-references** are extracted from Belgian statute text, not EUR-Lex full text
> - **Bilingual system** -- French and Dutch texts both have official status; always verify the authoritative language version for your jurisdiction

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [PRIVACY.md](PRIVACY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. See [PRIVACY.md](PRIVACY.md) for Ordre des barreaux francophones et germanophone (OBFG) / Orde van Vlaamse Balies (OVB) compliance guidance.

---

## Documentation

- **[EU Integration Guide](docs/EU_INTEGRATION_GUIDE.md)** -- Detailed EU cross-reference documentation
- **[EU Usage Examples](docs/EU_USAGE_EXAMPLES.md)** -- Practical EU lookup examples
- **[Security Policy](SECURITY.md)** -- Vulnerability reporting and scanning details
- **[Disclaimer](DISCLAIMER.md)** -- Legal disclaimers and professional use notices
- **[Privacy](PRIVACY.md)** -- Client confidentiality and data handling

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Belgium-law-mcp
cd Belgium-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest                     # Ingest statutes from ejustice
npm run build:db                   # Rebuild SQLite database
npm run drift:detect               # Run drift detection
npm run check-updates              # Check for amendments and new statutes
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~126 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### @ansvar/belgian-law-mcp (This Project)
**Query 5,775 Belgian statutes directly from Claude** -- loi protection données, Code pénal, Code civil, and more. Full provision text with EU cross-references. `npx @ansvar/belgian-law-mcp`

### [@ansvar/dutch-law-mcp](https://github.com/Ansvar-Systems/dutch-law-mcp)
**Query Dutch legislation** -- AVG, Wetboek van Strafrecht, Burgerlijk Wetboek, and more. `npx @ansvar/dutch-law-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

**70+ national law MCPs** covering Austria, Denmark, Finland, France, Germany, Ireland, Italy, Netherlands, Norway, Poland, Portugal, Slovenia, Spain, Sweden, Switzerland, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion (Cour de cassation, Conseil d'État)
- EU regulation cross-reference expansion
- German-language Community texts
- Regional law coverage (Wallonia, Flanders, Brussels-Capital)
- Historical statute versions and amendment tracking

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (5,775 statutes, 142,743 provisions)
- [x] EU law integration tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [x] Daily freshness checks
- [ ] Court case law expansion
- [ ] Historical statute versions (amendment tracking)
- [ ] German-language Community law
- [ ] Regional/community legislation coverage

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{belgian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Belgian Law MCP Server: Production-Grade Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Belgium-law-mcp},
  note = {5,775 Belgian statutes with 142,743 provisions and EU law cross-references}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Service public fédéral Justice (Belgian open government data)
- **EU Metadata:** EUR-Lex (EU public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the European market. This MCP server started as our internal reference tool for Belgian and EU institutional law -- turns out everyone working at the EU-national interface has the same research frustrations.

So we're open-sourcing it. Navigating 5,775 statutes across two languages shouldn't require a law degree in both French and Dutch.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
