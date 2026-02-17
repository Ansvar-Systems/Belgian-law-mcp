/**
 * Belgian legal citation validator.
 *
 * Validates that the cited statute and article exist in the database.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import type { ValidationResult } from '../types/index.js';
import { parseCitation } from './parser.js';

interface DocumentRow {
  id: string;
  title: string;
  url?: string | null;
  status: string;
}

const STATUTE_ID_PATTERN = /^(?:loi|wet)-\d{4}-\d{2}-\d{2}-\d{10}-(?:fr|nl)$/i;

const FRENCH_MONTHS: Record<string, string> = {
  JANVIER: '01',
  FEVRIER: '02',
  MARS: '03',
  AVRIL: '04',
  MAI: '05',
  JUIN: '06',
  JUILLET: '07',
  AOUT: '08',
  SEPTEMBRE: '09',
  OCTOBRE: '10',
  NOVEMBRE: '11',
  DECEMBRE: '12',
};

const DUTCH_MONTHS: Record<string, string> = {
  JANUARI: '01',
  FEBRUARI: '02',
  MAART: '03',
  APRIL: '04',
  MEI: '05',
  JUNI: '06',
  JULI: '07',
  AUGUSTUS: '08',
  SEPTEMBER: '09',
  OKTOBER: '10',
  NOVEMBER: '11',
  DECEMBER: '12',
};

const MONTHS: Record<string, string> = { ...FRENCH_MONTHS, ...DUTCH_MONTHS };

export function validateCitation(db: Database, citation: string): ValidationResult {
  const parsed = parseCitation(citation);
  const warnings: string[] = [];

  if (!parsed.valid) {
    return {
      citation: parsed,
      document_exists: false,
      provision_exists: false,
      warnings: [parsed.error ?? 'Invalid citation format'],
    };
  }

  const document = resolveDocument(db, parsed.title ?? '');
  if (!document) {
    return {
      citation: parsed,
      document_exists: false,
      provision_exists: false,
      warnings: [`Document "${parsed.title ?? 'unknown'}" not found in database`],
    };
  }

  if (document.status === 'repealed') {
    warnings.push('This statute has been repealed');
  }

  let provisionExists = false;
  if (parsed.section) {
    const sectionA = parsed.section;
    const sectionB = parsed.section.replace(/\s+/g, '');
    const refA = `art${sectionA}`;
    const refB = `art${sectionB}`;

    const provision = db.prepare(
      `SELECT 1
       FROM legal_provisions
       WHERE document_id = ?
         AND (
           section = ? OR section = ?
           OR provision_ref = ? OR provision_ref = ?
         )
       LIMIT 1`
    ).get(document.id, sectionA, sectionB, refA, refB);

    provisionExists = !!provision;

    if (!provisionExists) {
      warnings.push(`Article ${parsed.section} not found in ${document.title}`);
    }
  } else {
    provisionExists = true;
  }

  return {
    citation: parsed,
    document_exists: true,
    provision_exists: provisionExists,
    document_title: document.title,
    document_url: document.url ?? undefined,
    status: document.status,
    warnings,
  };
}

function resolveDocument(db: Database, reference: string): DocumentRow | undefined {
  const trimmed = reference.trim();
  if (!trimmed) {
    return undefined;
  }

  if (STATUTE_ID_PATTERN.test(trimmed)) {
    return db.prepare(
      'SELECT id, title, url, status FROM legal_documents WHERE id = ? LIMIT 1'
    ).get(trimmed) as DocumentRow | undefined;
  }

  const date = extractBelgianDate(trimmed);
  if (date) {
    const langPrefix = detectLanguagePrefix(trimmed);
    if (langPrefix) {
      const byPrefix = db.prepare(
        'SELECT id, title, url, status FROM legal_documents WHERE id LIKE ? ORDER BY id LIMIT 1'
      ).get(`${langPrefix}-${date}-%`) as DocumentRow | undefined;
      if (byPrefix) return byPrefix;
    }

    const byDate = db.prepare(
      "SELECT id, title, url, status FROM legal_documents WHERE id LIKE ? OR id LIKE ? ORDER BY id LIMIT 1"
    ).get(`loi-${date}-%`, `wet-${date}-%`) as DocumentRow | undefined;

    if (byDate) return byDate;
  }

  return db.prepare(
    `SELECT id, title, url, status
     FROM legal_documents
     WHERE title LIKE ?
     ORDER BY CASE WHEN title = ? THEN 0 ELSE 1 END, LENGTH(title)
     LIMIT 1`
  ).get(`%${trimmed}%`, trimmed) as DocumentRow | undefined;
}

function detectLanguagePrefix(value: string): 'loi' | 'wet' | null {
  const normalized = normalizeWord(value);
  if (normalized.startsWith('LOI')) return 'loi';
  if (normalized.startsWith('WET')) return 'wet';
  return null;
}

function extractBelgianDate(value: string): string | null {
  const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const textualMatch = value.match(/(\d{1,2})\s+([\p{L}.-]+)\s+(\d{4})/iu);
  if (!textualMatch) {
    return null;
  }

  const day = textualMatch[1].padStart(2, '0');
  const monthKey = normalizeWord(textualMatch[2]);
  const month = MONTHS[monthKey];
  if (!month) {
    return null;
  }

  const year = textualMatch[3];
  return `${year}-${month}-${day}`;
}

function normalizeWord(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}
