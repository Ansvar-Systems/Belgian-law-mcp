#!/usr/bin/env tsx
/**
 * Upstream drift detection for anchored Belgian legal texts.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GoldenHashEntry {
  id: string;
  description: string;
  upstream_url: string;
  selector_hint: string;
  expected_sha256: string;
  expected_snippet: string;
}

interface GoldenHashesFile {
  provisions: GoldenHashEntry[];
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function sha256(text: string): string {
  return createHash('sha256').update(normalizeText(text)).digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const hashesPath = join(__dirname, '..', 'fixtures', 'golden-hashes.json');
  const hashes = JSON.parse(readFileSync(hashesPath, 'utf-8')) as GoldenHashesFile;

  if (!Array.isArray(hashes.provisions)) {
    throw new Error('fixtures/golden-hashes.json must contain a "provisions" array');
  }

  let ok = 0;
  let drift = 0;
  let errors = 0;
  let skipped = 0;

  console.log(`Drift detection: checking ${hashes.provisions.length} anchored provision source(s)...`);

  for (const entry of hashes.provisions) {
    if (entry.expected_sha256 === 'COMPUTE_ON_FIRST_RUN') {
      console.log(`SKIP  ${entry.id}: hash not initialized`);
      skipped++;
      await sleep(1000);
      continue;
    }

    try {
      const response = await fetch(entry.upstream_url, {
        headers: { 'User-Agent': 'Ansvar-Belgium-DriftDetect/1.0' },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        console.log(`ERROR ${entry.id}: HTTP ${response.status}`);
        errors++;
        await sleep(1000);
        continue;
      }

      const text = await response.text();
      const hash = sha256(text);

      if (hash !== entry.expected_sha256) {
        console.log(`DRIFT ${entry.id}: ${entry.description}`);
        console.log(`      expected=${entry.expected_sha256}`);
        console.log(`      actual=${hash}`);
        drift++;
      } else {
        console.log(`OK    ${entry.id}: ${entry.description}`);
        ok++;
      }
    } catch (error) {
      errors++;
      console.log(
        `ERROR ${entry.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    await sleep(1000);
  }

  console.log('');
  console.log(`Results: ${ok} OK, ${drift} drift, ${errors} errors, ${skipped} skipped`);

  if (drift > 0) {
    process.exit(2);
  }
  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Fatal drift detection error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
