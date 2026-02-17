import { describe, it, expect } from 'vitest';
import { formatCitationTool } from '../../src/tools/format-citation.js';

describe('format_citation tool', () => {
  it('formats full citation', async () => {
    const result = await formatCitationTool({
      citation: 'Loi du 2 fevrier 1994, art. 1',
      format: 'full',
    });

    expect(result.results.valid).toBe(true);
    expect(result.results.formatted).toBe('Loi du 2 fevrier 1994, art. 1');
  });

  it('formats short citation', async () => {
    const result = await formatCitationTool({
      citation: 'Loi du 2 fevrier 1994, art. 1',
      format: 'short',
    });

    expect(result.results.formatted).toBe('art. 1 Loi du 2 fevrier 1994');
  });

  it('returns invalid for empty input', async () => {
    const result = await formatCitationTool({ citation: '' });
    expect(result.results.valid).toBe(false);
    expect(result.results.error).toBe('Empty citation');
  });
});
