import { describe, it, expect } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import { detectCapabilities, readDbMetadata, upgradeMessage } from '../src/capabilities.js';
import { createTestDatabase, closeTestDatabase } from './fixtures/test-db.js';

describe('capabilities', () => {
  it('detects expected capabilities from test schema', () => {
    const db = createTestDatabase();
    const caps = detectCapabilities(db);

    expect(caps.has('core_legislation')).toBe(true);
    expect(caps.has('eu_references')).toBe(true);
    expect(caps.has('case_law')).toBe(true);
    expect(caps.has('preparatory_works')).toBe(false);

    closeTestDatabase(db);
  });

  it('reads db metadata values', () => {
    const db = createTestDatabase();
    const meta = readDbMetadata(db);

    expect(meta.tier).toBe('free');
    expect(meta.schema_version).toBe('1.0');
    expect(meta.built_at).toBe('2026-02-16T00:00:00.000Z');

    closeTestDatabase(db);
  });

  it('returns defaults when metadata table is missing', () => {
    const db = new Database(':memory:');
    const meta = readDbMetadata(db);

    expect(meta.tier).toBe('free');
    expect(meta.schema_version).toBe('1.0');

    db.close();
  });

  it('formats upgrade message', () => {
    expect(upgradeMessage('case_law')).toContain('professional-tier');
  });
});
