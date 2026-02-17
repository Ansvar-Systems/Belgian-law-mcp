import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type Database from '@ansvar/mcp-sqlite';
import { validateCitation } from '../../src/citation/validator.js';
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';

describe('citation validator (Belgian)', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase(db);
  });

  it('validates citation by law title and article', () => {
    const result = validateCitation(db, 'Loi du 2 fevrier 1994, art. 1');
    expect(result.document_exists).toBe(true);
    expect(result.provision_exists).toBe(true);
    expect(result.document_title).toContain('protection de la jeunesse');
  });

  it('validates citation by statute id and article', () => {
    const result = validateCitation(db, 'loi-1994-02-02-1994009284-fr, art. 10');
    expect(result.document_exists).toBe(true);
    expect(result.provision_exists).toBe(true);
  });

  it('flags missing article in existing statute', () => {
    const result = validateCitation(db, 'Loi du 2 fevrier 1994, art. 99');
    expect(result.document_exists).toBe(true);
    expect(result.provision_exists).toBe(false);
    expect(result.warnings.some((w) => w.includes('Article 99 not found'))).toBe(true);
  });

  it('warns when statute is repealed', () => {
    const result = validateCitation(db, 'Loi du 10 fevrier 1994, art. 1');
    expect(result.document_exists).toBe(true);
    expect(result.status).toBe('repealed');
    expect(result.warnings).toContain('This statute has been repealed');
  });

  it('returns invalid for unparseable citation', () => {
    const result = validateCitation(db, 'This is not a citation');
    expect(result.document_exists).toBe(false);
    expect(result.provision_exists).toBe(false);
  });
});
