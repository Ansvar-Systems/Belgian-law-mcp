import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type Database from '@ansvar/mcp-sqlite';
import { getProvision } from '../../src/tools/get-provision.js';
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';

describe('get_provision', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase(db);
  });

  it('gets specific provision by provision_ref', async () => {
    const result = await getProvision(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      provision_ref: 'art1',
    });

    expect(result.results).not.toBeNull();
    expect(Array.isArray(result.results)).toBe(false);
    const row = result.results as Exclude<typeof result.results, null | unknown[]>;
    expect(row.provision_ref).toBe('art1');
    expect(row.content).toContain('protection');
  });

  it('gets specific provision by chapter+section fallback', async () => {
    const result = await getProvision(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      chapter: '1',
      section: '1',
    });

    expect(result.results).not.toBeNull();
    const row = result.results as Exclude<typeof result.results, null | unknown[]>;
    expect(row.provision_ref).toBe('art1');
  });

  it('returns all provisions when provision is omitted', async () => {
    const result = await getProvision(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
    });

    expect(Array.isArray(result.results)).toBe(true);
    expect((result.results as unknown[]).length).toBeGreaterThan(1);
  });

  it('supports historical lookup by as_of_date', async () => {
    const result = await getProvision(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      provision_ref: 'art1',
      as_of_date: '2000-01-01',
    });

    expect(result.results).not.toBeNull();
    const row = result.results as Exclude<typeof result.results, null | unknown[]>;
    expect(row.content).toContain('Ancien texte');
    expect(row.valid_to).toBe('2010-01-01');
  });

  it('returns null for unknown provision', async () => {
    const result = await getProvision(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      provision_ref: 'art99',
    });

    expect(result.results).toBeNull();
  });

  it('throws when document_id is missing', async () => {
    await expect(
      getProvision(db, { document_id: '' })
    ).rejects.toThrow('document_id is required');
  });
});
