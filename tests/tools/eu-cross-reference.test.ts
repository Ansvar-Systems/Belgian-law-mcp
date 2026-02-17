import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type Database from '@ansvar/mcp-sqlite';
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';
import { getEUBasis } from '../../src/tools/get-eu-basis.js';
import { getBelgianImplementations } from '../../src/tools/get-belgian-implementations.js';
import { searchEUImplementations } from '../../src/tools/search-eu-implementations.js';
import { getProvisionEUBasis } from '../../src/tools/get-provision-eu-basis.js';
import { validateEUCompliance } from '../../src/tools/validate-eu-compliance.js';

describe('EU cross-reference tools', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase(db);
  });

  it('returns EU basis for a Belgian statute', async () => {
    const result = await getEUBasis(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      include_articles: true,
    });

    expect(result.results.document_id).toBe('loi-1994-02-02-1994009284-fr');
    expect(result.results.eu_documents.length).toBeGreaterThan(0);
    expect(result.results.eu_documents[0].id).toBe('regulation:2016/679');
  });

  it('returns Belgian implementations for an EU document', async () => {
    const result = await getBelgianImplementations(db, {
      eu_document_id: 'regulation:2016/679',
    });

    expect(result.results.implementations.length).toBeGreaterThan(0);
    expect(result.results.implementations[0].document_id).toBe('loi-1994-02-02-1994009284-fr');
  });

  it('searches EU implementations and filters by implementation presence', async () => {
    const result = await searchEUImplementations(db, {
      has_belgian_implementation: true,
      type: 'regulation',
    });

    expect(result.results.results.length).toBeGreaterThan(0);
    for (const row of result.results.results) {
      expect(row.belgian_statute_count).toBeGreaterThan(0);
    }
  });

  it('returns provision-level EU basis', async () => {
    const result = await getProvisionEUBasis(db, {
      document_id: 'loi-1994-02-02-1994009284-fr',
      provision_ref: 'art1',
    });

    expect(result.results.eu_references.length).toBeGreaterThan(0);
    expect(result.results.eu_references[0].article).toBe('6.1.e');
  });

  it('marks outdated references as partial compliance', async () => {
    const result = await validateEUCompliance(db, {
      document_id: 'loi-1994-02-10-1994009323-fr',
    });

    expect(result.results.compliance_status).toBe('partial');
    expect(result.results.outdated_references?.length).toBeGreaterThan(0);
  });

  it('returns not_applicable when no EU references are present', async () => {
    db.prepare(
      `INSERT INTO legal_documents (id, type, title, status, issued_date, in_force_date)
       VALUES ('loi-2000-01-01-2000000001-fr', 'statute', 'Loi sans reference UE', 'in_force', '2000-01-01', '2000-01-10')`
    ).run();

    const result = await validateEUCompliance(db, {
      document_id: 'loi-2000-01-01-2000000001-fr',
    });

    expect(result.results.compliance_status).toBe('not_applicable');
    expect(result.results.eu_references_found).toBe(0);
  });
});
