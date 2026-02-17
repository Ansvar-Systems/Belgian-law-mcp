/**
 * Belgian legal citation parser.
 *
 * Supported examples:
 *   "Loi du 2 fevrier 1994, art. 1"
 *   "Wet van 2 februari 1994, art. 1"
 *   "loi-1994-02-02-1994009284-fr, art. 1"
 *   "art. 1, loi-1994-02-02-1994009284-fr"
 */

import type { ParsedCitation } from '../types/index.js';

const ARTICLE_NUMBER = '(\\d+(?:\\s*[a-z]+)?(?:er)?)';
const STATUTE_ID = '((?:loi|wet)-\\d{4}-\\d{2}-\\d{2}-\\d{10}-(?:fr|nl))';

const ID_FIRST_PATTERN = new RegExp(`^${STATUTE_ID}\\s*,?\\s*(?:art\\.?|article)\\s*${ARTICLE_NUMBER}$`, 'i');
const ARTICLE_FIRST_ID_PATTERN = new RegExp(`^(?:art\\.?|article)\\s*${ARTICLE_NUMBER}\\s*,?\\s*${STATUTE_ID}$`, 'i');

const TITLE_FIRST_PATTERN = new RegExp(`^(.+?)\\s*,\\s*(?:art\\.?|article)\\s*${ARTICLE_NUMBER}$`, 'i');
const ARTICLE_FIRST_TITLE_PATTERN = new RegExp(`^(?:art\\.?|article)\\s*${ARTICLE_NUMBER}\\s*,\\s*(.+?)$`, 'i');

const YEAR_PATTERN = /(19|20)\d{2}/;

export function parseCitation(citation: string): ParsedCitation {
  const trimmed = citation.trim();
  if (!trimmed) {
    return {
      valid: false,
      type: 'unknown',
      error: 'Empty citation',
    };
  }

  let match = trimmed.match(ID_FIRST_PATTERN);
  if (match) {
    const documentId = match[1];
    const section = normalizeArticleNumber(match[2]);
    return {
      valid: true,
      type: 'statute',
      title: documentId,
      year: extractYear(documentId),
      section,
    };
  }

  match = trimmed.match(ARTICLE_FIRST_ID_PATTERN);
  if (match) {
    const section = normalizeArticleNumber(match[1]);
    const documentId = match[2];
    return {
      valid: true,
      type: 'statute',
      title: documentId,
      year: extractYear(documentId),
      section,
    };
  }

  match = trimmed.match(TITLE_FIRST_PATTERN);
  if (match) {
    const title = match[1].trim();
    const section = normalizeArticleNumber(match[2]);
    return {
      valid: true,
      type: 'statute',
      title,
      year: extractYear(title),
      section,
    };
  }

  match = trimmed.match(ARTICLE_FIRST_TITLE_PATTERN);
  if (match) {
    const section = normalizeArticleNumber(match[1]);
    const title = match[2].trim();
    return {
      valid: true,
      type: 'statute',
      title,
      year: extractYear(title),
      section,
    };
  }

  return {
    valid: false,
    type: 'unknown',
    error: `Could not parse Belgian citation: "${trimmed}"`,
  };
}

function extractYear(value: string): number | undefined {
  const match = value.match(YEAR_PATTERN);
  if (!match) {
    return undefined;
  }
  return Number(match[0]);
}

function normalizeArticleNumber(value: string): string {
  const compact = value.replace(/\s+/g, '').toLowerCase();
  return compact.replace(/^(\d+)er$/, '$1');
}
