#!/usr/bin/env tsx
/**
 * Check for updates in Belgian legislation sources.
 *
 * Detection strategy:
 * 1. Compare database build age against freshness threshold.
 * 2. Compare local per-year NUMAC counts vs Justel year index counts.
 *
 * Exit codes:
 * - 0: no updates detected
 * - 1: updates detected
 * - 2: check errors (source fetch failure)
 */

import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchLawContent, fetchYearIndex } from './lib/fetcher.js';
import { parseLawContent, parseYearIndex } from './lib/parser.js';
import type { LawIndexEntry } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = resolve(__dirname, '../data/database.db');

const FRESHNESS_MAX_DAYS = Number(process.env['MAX_DB_AGE_DAYS'] ?? '30');
const YEARS_TO_CHECK = Number(process.env['UPDATE_CHECK_YEARS'] ?? '2');
const MISSING_PROBE_LIMIT = Number(process.env['UPDATE_CHECK_MISSING_PROBE_LIMIT'] ?? '5');

function daysSince(isoDate: string): number | null {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) {
    return null;
  }
  return Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24));
}

async function main(): Promise<void> {
  console.log('Belgian Law MCP - Update Checker');
  console.log('');

  if (!existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}`);
    console.error('Run "npm run build:db" first.');
    process.exit(2);
  }

  const db = new Database(DB_PATH, { readonly: true });

  const metadataRows = db.prepare('SELECT key, value FROM db_metadata').all() as Array<{ key: string; value: string }>;
  const metadata = new Map(metadataRows.map((row) => [row.key, row.value]));

  const totalDocs = Number(
    (db.prepare("SELECT COUNT(*) as count FROM legal_documents WHERE type = 'statute'").get() as { count: number })
      .count
  );

  const latestIssued = (db.prepare('SELECT MAX(issued_date) as latest FROM legal_documents').get() as { latest: string | null }).latest;

  console.log(`Database: ${DB_PATH}`);
  console.log(`Statutes: ${totalDocs}`);
  console.log(`Latest issued_date: ${latestIssued ?? 'unknown'}`);

  let updatesDetected = 0;
  let errors = 0;

  const builtAt = metadata.get('built_at');
  if (builtAt) {
    const ageDays = daysSince(builtAt);
    if (ageDays == null) {
      console.log(`Metadata warning: invalid built_at value "${builtAt}"`);
    } else if (ageDays > FRESHNESS_MAX_DAYS) {
      updatesDetected++;
      console.log(
        `UPDATE AVAILABLE: database is ${ageDays} day(s) old (threshold ${FRESHNESS_MAX_DAYS})`
      );
    } else {
      console.log(`Database freshness OK: ${ageDays} day(s) old`);
    }
  } else {
    console.log('Metadata warning: db_metadata.built_at is missing');
  }

  const currentYear = new Date().getUTCFullYear();
  const firstYear = currentYear - (YEARS_TO_CHECK - 1);
  console.log('');
  console.log(`Checking Justel yearly indexes (${firstYear}-${currentYear})...`);

  for (let year = firstYear; year <= currentYear; year++) {
    try {
      const html = await fetchYearIndex(year, 'fr');
      const entries = parseYearIndex(html, 'fr');
      const entryByNumac = new Map<string, LawIndexEntry>();
      for (const entry of entries) {
        if (!entryByNumac.has(entry.numac)) {
          entryByNumac.set(entry.numac, entry);
        }
      }
      const remoteNumacs = [...entryByNumac.keys()];
      const remoteNumacCount = remoteNumacs.length;

      const localRows = db.prepare(
        `SELECT DISTINCT numac
         FROM legal_documents
         WHERE issued_date >= ? AND issued_date < ? AND numac IS NOT NULL`
      ).all(`${year}-01-01`, `${year + 1}-01-01`) as Array<{ numac: string }>;

      const localNumacs = new Set(localRows.map((row) => String(row.numac)));
      const localNumacCount = localNumacs.size;
      const missingNumacs = remoteNumacs.filter((numac) => !localNumacs.has(numac));

      if (missingNumacs.length === 0) {
        console.log(`Year ${year}: up to date (source=${remoteNumacCount}, local=${localNumacCount})`);
        continue;
      }

      if (missingNumacs.length > MISSING_PROBE_LIMIT) {
        updatesDetected++;
        console.log(
          `UPDATE AVAILABLE: ${year} has ${missingNumacs.length} source NUMAC entries not present locally (source=${remoteNumacCount}, local=${localNumacCount})`
        );
        continue;
      }

      let actionableMissing = 0;
      const nonIngestable: string[] = [];

      for (const numac of missingNumacs) {
        const entry = entryByNumac.get(numac);
        if (!entry) continue;

        try {
          const lawHtml = await fetchLawContent(entry.year, entry.month, entry.day, entry.numac, 'fr');
          const parsed = parseLawContent(lawHtml, entry.numac);
          if (parsed.provisions.length === 0) {
            nonIngestable.push(numac);
          } else {
            actionableMissing++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors++;
          actionableMissing++;
          console.log(
            `ERROR: failed to verify missing NUMAC ${numac} for ${year}: ${message}`
          );
        }
      }

      if (actionableMissing > 0) {
        updatesDetected++;
        console.log(
          `UPDATE AVAILABLE: ${year} has ${actionableMissing} ingestable source NUMAC entr${actionableMissing === 1 ? 'y' : 'ies'} not present locally (source=${remoteNumacCount}, local=${localNumacCount})`
        );
        if (nonIngestable.length > 0) {
          console.log(
            `  Ignored ${nonIngestable.length} non-ingestable source entr${nonIngestable.length === 1 ? 'y' : 'ies'} (no parseable articles): ${nonIngestable.join(', ')}`
          );
        }
      } else {
        console.log(
          `Year ${year}: up to date for ingestable laws (source=${remoteNumacCount}, local=${localNumacCount}; ignored ${nonIngestable.length} non-ingestable entr${nonIngestable.length === 1 ? 'y' : 'ies'})`
        );
      }
    } catch (error) {
      errors++;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`ERROR: failed to check year ${year}: ${message}`);
    }
  }

  db.close();

  console.log('');
  console.log('Summary');
  console.log(`Updates detected: ${updatesDetected}`);
  console.log(`Source check errors: ${errors}`);

  if (updatesDetected > 0) {
    console.log('');
    console.log('Suggested next steps:');
    console.log(`  npm run ingest -- --year-start ${firstYear} --year-end ${currentYear} --phase all --lang both`);
    console.log('  npm run build:db');
    process.exit(1);
  }

  if (errors > 0) {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(`Fatal update check error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
});
