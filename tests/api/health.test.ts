import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../api/health.js';

// The health handler returns `status: 'ok'` only when the backing SQLite DB
// is reachable. In CI the DB is built before tests; in local developer
// environments it may be absent (gitignored). When absent, the handler
// returns `status: 'degraded'` with zero counts — this is expected and must
// not cause a test failure.
const DB_PATH = join(process.cwd(), 'data', 'database.db');
const HAS_DB = existsSync(DB_PATH);

interface MockResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

function createMockResponse(): {
  res: VercelResponse;
  state: MockResponse;
} {
  const state: MockResponse = {
    statusCode: 200,
    body: null,
    headers: {},
  };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      state.headers[name.toLowerCase()] = value;
    },
  } as unknown as VercelResponse;

  return { res, state };
}

function createRequest(url: string): VercelRequest {
  return {
    url,
    headers: { host: 'localhost:3000' },
  } as unknown as VercelRequest;
}

describe('api/health', () => {
  it('returns health payload for /health', () => {
    const { res, state } = createMockResponse();
    handler(createRequest('/health'), res);

    expect(state.statusCode).toBe(200);
    const body = state.body as { status: string; server: string };
    expect(body.server).toBe('belgian-legal-citations');

    if (HAS_DB) {
      // When DB is present (CI), the handler should report healthy data.
      expect(body.status).toBe('ok');
    } else {
      // When DB is absent (local dev), degraded is the expected fallback.
      expect(body.status).toBe('degraded');
    }
  });

  it('returns version payload for /version', () => {
    const { res, state } = createMockResponse();
    handler(createRequest('/version'), res);

    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({
      name: 'belgian-legal-citations',
      transport: ['stdio', 'streamable-http'],
    });
  });

  it('returns version payload when query includes ?version', () => {
    const { res, state } = createMockResponse();
    handler(createRequest('/api/health?version'), res);

    expect(state.statusCode).toBe(200);
    expect((state.body as { version?: string }).version).toBeDefined();
  });
});
