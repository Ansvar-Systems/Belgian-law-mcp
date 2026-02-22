# Contributing Guide

Thank you for your interest in contributing to the Belgian Law MCP server!

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Belgium-law-mcp.git
   cd Belgium-law-mcp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Run tests**

   ```bash
   npm test
   ```

## Development Workflow

### Branching Strategy

This repository uses a `dev` branch workflow:

```
feature-branch -> PR to dev -> verify on dev -> PR to main -> deploy
```

- **`main`**: Production-ready. Only receives merges from `dev` via PR.
- **`dev`**: Integration branch. All changes land here first.
- **Feature branches**: Created from `dev` for individual tasks.

### Making Changes

1. Create a branch from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests:
   ```bash
   npm test
   ```

4. Build to check for TypeScript errors:
   ```bash
   npm run build
   ```

5. Run full validation:
   ```bash
   npm run validate
   ```

6. Commit your changes (use conventional commits):
   ```bash
   git commit -m "feat: add new tool for X"
   ```

7. Push and create a pull request **targeting `dev`**

### Testing with MCP Inspector

To test your changes interactively:

```bash
npx @anthropic/mcp-inspector node dist/index.js
```

## Code Style

### TypeScript

- Use TypeScript strict mode (ESM modules)
- Define interfaces for all function inputs/outputs
- Use async/await for all database operations
- Use `null` for "not found", throw for invalid input

### Naming

- Files: `kebab-case.ts`
- Interfaces: `PascalCase`
- Functions: `camelCase`
- MCP tools: `snake_case`
- Database tables/columns: `snake_case`

### Testing

- Unit tests with Vitest in `tests/`
- Contract tests in `__tests__/contract/` with `fixtures/golden-tests.json`
- All tests must pass before merging

## Adding a New Tool

1. Create a new file in `src/tools/your-tool.ts`
2. Add tests in `tests/tools/your-tool.test.ts`
3. Register the tool in `src/tools/registry.ts`
4. Add contract test cases in `fixtures/golden-tests.json`
5. Update README.md with the new tool

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Contract tests pass (`npm run test:contract`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] PR targets `dev` branch (not `main`)
- [ ] Documentation updated if needed

### Review Process

1. Automated CI checks must pass
2. At least one maintainer review required
3. Address feedback promptly

## Reporting Issues

### Bug Reports

Include: steps to reproduce, expected behavior, actual behavior, environment (Node version, OS).

### Feature Requests

Include: use case description, proposed solution (if any), alternatives considered.

## License

By contributing, you agree that your contributions will be licensed under Apache-2.0.

---

Thank you for contributing!
