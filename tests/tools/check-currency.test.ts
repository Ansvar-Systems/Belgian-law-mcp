import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type Database from '@ansvar/mcp-sqlite';
import { checkCurrency } from '../../src/tools/check-currency.js';
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';

describe('check_currency', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase(db);
  });

  it('reports in-force statute as current', async () => {
    const result = await checkCurrency(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
    });

    expect(result.results).not.toBeNull();
    const row = result.results as Exclude<typeof result.results, null>;
    expect(row.status).toBe('in_force');
    expect(row.is_current).toBe(true);
  });

  it('reports repealed statute warnings', async () => {
    const result = await checkCurrency(db, {
      document_id: 'loi-1994-02-10-1994009323-fr',
    });

    expect(result.results).not.toBeNull();
    const row = result.results as Exclude<typeof result.results, null>;
    expect(row.status).toBe('repealed');
    expect(row.warnings).toContain('This statute has been repealed');
  });

  it('reports provision existence', async () => {
    const found = await checkCurrency(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      provision_ref: 'art1',
    });

    expect((found.results as Exclude<typeof found.results, null>).provision_exists).toBe(true);

    const missing = await checkCurrency(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      provision_ref: 'art999',
    });

    expect((missing.results as Exclude<typeof missing.results, null>).provision_exists).toBe(false);
  });

  it('computes as_of_date status fields', async () => {
    const result = await checkCurrency(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      as_of_date: '1994-02-15',
    });

    const row = result.results as Exclude<typeof result.results, null>;
    expect(row.as_of_date).toBe('1994-02-15');
    expect(row.status_as_of).toBe('not_yet_in_force');
    expect(row.is_in_force_as_of).toBe(false);
  });

  it('returns null for unknown statute', async () => {
    const result = await checkCurrency(db, { document_id: 'unknown-doc' });
    expect(result.results).toBeNull();
  });
});
