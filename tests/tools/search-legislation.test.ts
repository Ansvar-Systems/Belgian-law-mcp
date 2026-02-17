import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type Database from '@ansvar/mcp-sqlite';
import { searchLegislation } from '../../src/tools/search-legislation.js';
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';

describe('search_legislation', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase(db);
  });

  it('finds provisions by keyword', async () => {
    const result = await searchLegislation(db, { query: 'jeunesse' });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]).toHaveProperty('document_id');
    expect(result._metadata).toHaveProperty('source_authority');
  });

  it('filters by document_id', async () => {
    const result = await searchLegislation(db, {
      query: 'protection',
      document_id: 'loi-1994-02-02-1994009284-fr',
    });

    expect(result.results.length).toBeGreaterThan(0);
    for (const row of result.results) {
      expect(row.document_id).toBe('loi-1994-02-02-1994009284-fr');
    }
  });

  it('filters by status', async () => {
    const result = await searchLegislation(db, {
      query: 'mediation',
      status: 'repealed',
    });

    expect(result.results.length).toBeGreaterThan(0);
    for (const row of result.results) {
      expect(row.document_id).toBe('loi-1994-02-10-1994009323-fr');
    }
  });

  it('supports as_of_date via historical versions', async () => {
    const result = await searchLegislation(db, {
      query: 'ancien texte',
      document_id: 'loi-1994-02-02-1994009284-fr',
      as_of_date: '2000-01-01',
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].provision_ref).toBe('art1');
    expect(result.results[0]).toHaveProperty('valid_from');
  });

  it('returns empty set for empty query', async () => {
    const result = await searchLegislation(db, { query: '' });
    expect(result.results).toEqual([]);
  });

  it('rejects invalid as_of_date', async () => {
    await expect(
      searchLegislation(db, { query: 'protection', as_of_date: '2026/01/01' })
    ).rejects.toThrow('as_of_date must be an ISO date');
  });
});
