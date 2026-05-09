/**
 * about — Server metadata, dataset statistics, and provenance.
 *
 * Returns the fleet-wide contract shape: { server, dataset, provenance, security, _metadata }.
 * Asserted by __tests__/contract/golden.test.ts via fixtures/golden-tests.json (be-020).
 */

import type Database from '@ansvar/mcp-sqlite';
import { detectCapabilities, readDbMetadata } from '../capabilities.js';
import { generateResponseMetadata } from '../utils/metadata.js';

export interface AboutContext {
  version: string;
  fingerprint: string;
  dbBuilt: string;
}

function safeCount(db: InstanceType<typeof Database>, sql: string): number {
  try {
    const row = db.prepare(sql).get() as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  } catch {
    return 0;
  }
}

function safeCapabilities(db: InstanceType<typeof Database>): string[] {
  try {
    return [...detectCapabilities(db)];
  } catch {
    return [];
  }
}

export function getAbout(db: InstanceType<typeof Database>, context: AboutContext) {
  const meta = readDbMetadata(db);

  return {
    server: {
      name: 'Belgian Law MCP',
      version: context.version,
      repository: 'https://github.com/Ansvar-Systems/Belgium-law-mcp',
    },
    dataset: {
      jurisdiction: 'Belgium (BE)',
      languages: ['fr', 'nl', 'de'],
      counts: {
        legal_documents: safeCount(db, 'SELECT COUNT(*) as count FROM legal_documents'),
        legal_provisions: safeCount(db, 'SELECT COUNT(*) as count FROM legal_provisions'),
        definitions: safeCount(db, 'SELECT COUNT(*) as count FROM definitions'),
        eu_documents: safeCount(db, 'SELECT COUNT(*) as count FROM eu_documents'),
        eu_references: safeCount(db, 'SELECT COUNT(*) as count FROM eu_references'),
      },
      fingerprint: context.fingerprint,
      built_at: context.dbBuilt,
      tier: meta.tier,
      schema_version: meta.schema_version,
      capabilities: safeCapabilities(db),
    },
    provenance: {
      sources: [
        {
          name: 'Belgian Official Gazette (Moniteur Belge / Belgisch Staatsblad)',
          authority: 'FPS Justice (SPF Justice / FOD Justitie)',
          url: 'https://www.ejustice.just.fgov.be',
          license: 'Public Domain (Belgian Copyright Act, Art. 8)',
        },
      ],
    },
    security: {
      access_model: 'read-only',
      pii: 'none',
    },
    _metadata: generateResponseMetadata(db),
  };
}
