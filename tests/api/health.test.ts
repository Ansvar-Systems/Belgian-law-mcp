import { describe, it, expect } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../api/health.js';

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
    expect(state.body).toMatchObject({
      status: 'ok',
      server: 'belgian-legal-citations',
    });
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
