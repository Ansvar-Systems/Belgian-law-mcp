/**
 * FTS5 query builder for Belgian Law MCP.
 */

const FTS5_BOOLEAN_OPS = /\b(AND|OR|NOT)\b/;

/**
 * Detect whether input contains FTS5 boolean operators.
 */
export function hasBooleanOperators(input: string): boolean {
  return FTS5_BOOLEAN_OPS.test(input);
}

/**
 * Sanitize user input for safe FTS5 queries.
 * Preserves boolean operators (AND, OR, NOT) when detected.
 * Preserves trailing * on words for FTS5 prefix search.
 */
export function sanitizeFtsInput(input: string): string {
  if (hasBooleanOperators(input)) {
    return input.replace(/[{}[\]^~*:]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Preserve trailing * on words (FTS5 prefix search) but strip other special chars
  return input
    .replace(/['"(){}[\]^~:]/g, ' ')
    .replace(/\*(?!\s|$)/g, ' ')    // strip * unless at end of word
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate common suffixes for stemming fallback.
 */
function stemWord(word: string): string | null {
  if (word.length < 5) return null;
  const lower = word.toLowerCase();
  for (const suffix of [
    'ies', 'ing', 'ers', 'tion', 'ment', 'ness',
    'able', 'ible', 'ous', 'ive', 'ed', 'es', 'er', 'ly', 's',
  ]) {
    if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
      return lower.slice(0, -suffix.length);
    }
  }
  return null;
}

/**
 * Build FTS5 query variants for a search term.
 * Returns variants in order of specificity (most specific first):
 * 1. Exact phrase match
 * 2. All terms required (AND)
 * 3. Prefix AND (last term gets prefix wildcard)
 * 4. Stemmed prefix (suffix-truncated + wildcard)
 * 5. Any term matches (OR) — broad fallback
 */
export function buildFtsQueryVariants(sanitized: string): string[] {
  if (!sanitized || sanitized.trim().length === 0) {
    return [];
  }

  if (hasBooleanOperators(sanitized)) {
    return [sanitized];
  }

  const terms = sanitized.split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return [];

  const variants: string[] = [];

  if (terms.length > 1) {
    variants.push(`"${terms.join(' ')}"`);
    variants.push(terms.join(' AND '));
    variants.push([...terms.slice(0, -1), `${terms[terms.length - 1]}*`].join(' AND '));
  } else {
    variants.push(terms[0]);
    if (terms[0].length >= 3) {
      variants.push(`${terms[0]}*`);
    }
  }

  const stemmedTerms = terms.map(t => {
    const stem = stemWord(t);
    return stem ? `${stem}*` : t;
  });
  if (stemmedTerms.some((s, i) => s !== terms[i])) {
    variants.push(stemmedTerms.join(' AND '));
  }

  if (terms.length > 1) {
    variants.push(terms.join(' OR '));
  }

  return variants;
}

/**
 * Build a SQL LIKE pattern from search terms.
 * Used as a final fallback when FTS5 returns no results.
 */
export function buildLikePattern(query: string): string {
  const terms = query.trim().split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return '%';
  return `%${terms.join('%')}%`;
}
