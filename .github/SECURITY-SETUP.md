# Security Setup for GitHub Actions

This document describes the secrets and configuration required for the Belgian Law MCP GitHub Actions workflows.

## Required Secrets

| Secret | Used By | Description |
|--------|---------|-------------|
| `NPM_TOKEN` | `publish.yml` | npm automation token for publishing `@ansvar/belgian-law-mcp` |

## GitHub Repository Settings

Ensure the following are enabled in **Settings** > **Code security and analysis**:

- **Dependency graph**: Enabled
- **Dependabot alerts**: Enabled
- **Code scanning**: Enabled
- **Secret scanning**: Enabled

