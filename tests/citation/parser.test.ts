import { describe, it, expect } from 'vitest';
import { parseCitation } from '../../src/citation/parser.js';

describe('citation parser (Belgian)', () => {
  it('parses FR statute title citation', () => {
    const parsed = parseCitation('Loi du 2 fevrier 1994, art. 1');
    expect(parsed.valid).toBe(true);
    expect(parsed.type).toBe('statute');
    expect(parsed.section).toBe('1');
    expect(parsed.year).toBe(1994);
  });

  it('parses NL statute title citation', () => {
    const parsed = parseCitation('Wet van 2 februari 1994, art. 10');
    expect(parsed.valid).toBe(true);
    expect(parsed.section).toBe('10');
    expect(parsed.year).toBe(1994);
  });

  it('parses statute-id citation', () => {
    const parsed = parseCitation('loi-1994-02-02-1994009284-fr, art. 1');
    expect(parsed.valid).toBe(true);
    expect(parsed.title).toBe('loi-1994-02-02-1994009284-fr');
    expect(parsed.section).toBe('1');
  });

  it('parses article-first citation form', () => {
    const parsed = parseCitation('art. 1, loi-1994-02-02-1994009284-fr');
    expect(parsed.valid).toBe(true);
    expect(parsed.section).toBe('1');
  });

  it('rejects unsupported citation forms', () => {
    const parsed = parseCitation('Section 3, Data Protection Act 2018');
    expect(parsed.valid).toBe(false);
    expect(parsed.error).toContain('Could not parse Belgian citation');
  });
});
