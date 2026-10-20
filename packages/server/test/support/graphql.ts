import request from 'supertest';
import type { TestApp } from './app.js';

export interface GraphqlRequest {
  query: string;
  variables?: Record<string, unknown>;
  /** Cookies to send, name to value */
  cookies?: Record<string, string>;
  /** Sent as `Authorization: Bearer <token>` */
  bearer?: string;
}

/** The error shape of the server: formatError in app.module.ts keeps these three fields */
export interface GraphqlError {
  message: string;
  code: string;
  path?: unknown;
}

export interface GraphqlResult {
  status: number;
  /** The `data` member of the response body; read it with pick() or compare it with toMatchObject() */
  data: unknown;
  errors: GraphqlError[];
  /** The cookies the response set, name to value; a cleared cookie has the value '' */
  cookies: Record<string, string>;
  /** The Set-Cookie headers as sent */
  setCookie: string[];
}

function isGraphqlError(value: unknown): value is GraphqlError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    'code' in value &&
    typeof value.code === 'string'
  );
}

/** Node delivers Set-Cookie as a list, while the types of supertest describe every header as a string */
function readSetCookie(header: unknown): string[] {
  if (!Array.isArray(header)) {
    return [];
  }
  return header.filter((line): line is string => typeof line === 'string');
}

function parseCookies(setCookie: string[]): Record<string, string> {
  return Object.fromEntries(
    setCookie.map((line) => {
      const [pair = ''] = line.split(';');
      const separator = pair.indexOf('=');
      return [pair.slice(0, separator), decodeURIComponent(pair.slice(separator + 1))];
    })
  );
}

/**
 * One request to POST /graphql. The cookies and the bearer token are optional; a request without them is anonymous.
 */
export async function gql(
  { app }: Pick<TestApp, 'app'>,
  { query, variables, cookies, bearer }: GraphqlRequest
): Promise<GraphqlResult> {
  const call = request(app.getHttpServer()).post('/graphql').send({ query, variables });
  if (cookies) {
    call.set(
      'Cookie',
      Object.entries(cookies).map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    );
  }
  if (bearer) {
    call.set('Authorization', `Bearer ${bearer}`);
  }

  const response = await call;
  const body: unknown = response.body;
  const errors = pick(body, 'errors');
  const setCookie = readSetCookie(response.headers['set-cookie']);

  return {
    status: response.status,
    data: pick(body, 'data'),
    errors: Array.isArray(errors) ? errors.filter(isGraphqlError) : [],
    cookies: parseCookies(setCookie),
    setCookie,
  };
}

/** Reads a nested member of a parsed JSON value; undefined when any step is missing */
export function pick(value: unknown, ...path: (string | number)[]): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined;
    }
    current = Reflect.get(current, key);
  }
  return current;
}

/** Like pick(), for a member that must be a string; the failure names the path and what was found */
export function pickString(value: unknown, ...path: (string | number)[]): string {
  const found = pick(value, ...path);
  if (typeof found !== 'string') {
    throw new Error(`Expected a string at ${path.join('.')}, found ${JSON.stringify(found)}`);
  }
  return found;
}
