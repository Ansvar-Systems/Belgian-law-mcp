import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('vercel.json configuration', () => {
  it('routes /version through version query mode', () => {
    const content = readFileSync(join(process.cwd(), 'vercel.json'), 'utf-8');
    const config = JSON.parse(content) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };

    const versionRewrite = config.rewrites?.find((r) => r.source === '/version');
    expect(versionRewrite).toBeDefined();
    expect(versionRewrite?.destination).toBe('/api/health?version');
  });
});
