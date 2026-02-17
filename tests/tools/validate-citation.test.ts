import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type Database from '@ansvar/mcp-sqlite';
import { validateCitationTool } from '../../src/tools/validate-citation.js';
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';

describe('validate_citation tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase(db);
  });

  it('returns valid=true for resolvable citation', async () => {
    const result = await validateCitationTool(db, {
      citation: 'Loi du 2 fevrier 1994, art. 1',
    });

    expect(result.results.valid).toBe(true);
    expect(result.results.document_exists).toBe(true);
    expect(result.results.provision_exists).toBe(true);
    expect(result.results.formatted_citation).toContain('art. 1');
    expect(result.results.citation_urls.length).toBeGreaterThan(0);
    expect(result.results.citation_urls[0]).toMatch(/^https?:\/\//);
  });

  it('returns validation warning for unknown citation', async () => {
    const result = await validateCitationTool(db, {
      citation: 'Not a legal citation',
    });

    expect(result.results.valid).toBe(false);
    expect(result.results.warnings.length).toBeGreaterThan(0);
    expect(result.results.citation_urls).toEqual([]);
  });

  it('handles empty citation gracefully', async () => {
    const result = await validateCitationTool(db, { citation: '' });

    expect(result.results.valid).toBe(false);
    expect(result.results.warnings).toContain('Empty citation');
    expect(result.results.citation_urls).toEqual([]);
  });
});
