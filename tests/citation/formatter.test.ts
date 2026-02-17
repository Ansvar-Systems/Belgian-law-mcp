import { describe, it, expect } from 'vitest';
import { formatCitation } from '../../src/citation/formatter.js';

describe('citation formatter (Belgian)', () => {
  const parsed = {
    valid: true,
    type: 'statute' as const,
    title: 'Loi du 2 fevrier 1994',
    section: '1',
  };

  it('formats full citation', () => {
    expect(formatCitation(parsed, 'full')).toBe('Loi du 2 fevrier 1994, art. 1');
  });

  it('formats short citation', () => {
    expect(formatCitation(parsed, 'short')).toBe('art. 1 Loi du 2 fevrier 1994');
  });

  it('formats pinpoint citation', () => {
    expect(formatCitation(parsed, 'pinpoint')).toBe('art. 1');
  });

  it('returns empty string for invalid parsed citation', () => {
    expect(
      formatCitation({ valid: false, type: 'unknown', error: 'bad' }, 'full')
    ).toBe('');
  });
});
