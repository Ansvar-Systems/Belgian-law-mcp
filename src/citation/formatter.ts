/**
 * Belgian legal citation formatter.
 */

import type { ParsedCitation, CitationFormat } from '../types/index.js';

export function formatCitation(
  parsed: ParsedCitation,
  format: CitationFormat = 'full'
): string {
  if (!parsed.valid || !parsed.section) {
    return '';
  }

  const pinpoint = buildPinpoint(parsed);

  switch (format) {
    case 'full':
      if (parsed.title?.trim()) {
        return `${parsed.title.trim()}, art. ${pinpoint}`;
      }
      return `art. ${pinpoint}`;

    case 'short':
      if (parsed.title?.trim()) {
        return `art. ${pinpoint} ${parsed.title.trim()}`;
      }
      return `art. ${pinpoint}`;

    case 'pinpoint':
      return `art. ${pinpoint}`;

    default:
      if (parsed.title?.trim()) {
        return `${parsed.title.trim()}, art. ${pinpoint}`;
      }
      return `art. ${pinpoint}`;
  }
}

function buildPinpoint(parsed: ParsedCitation): string {
  let ref = parsed.section ?? '';
  if (parsed.subsection) {
    ref += `(${parsed.subsection})`;
  }
  if (parsed.paragraph) {
    ref += `(${parsed.paragraph})`;
  }
  return ref;
}
