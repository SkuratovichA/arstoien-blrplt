import type { TestApp } from './app.js';
import { gql, pickString } from './graphql.js';
import { DEFAULT_PASSWORD } from './users.js';

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user { id email }
    }
  }
`;

export interface Session {
  userId: string;
  accessToken: string;
  refreshToken: string;
  /** The cookies a browser would send after the login */
  cookies: { accessToken: string; refreshToken: string };
}

/**
 * Logs in through the login mutation and returns the tokens. It fails with the errors of the response when the login is refused, so a test that needs a session never continues without one.
 */
export async function loginAs(
  testApp: Pick<TestApp, 'app'>,
  email: string,
  password: string = DEFAULT_PASSWORD
): Promise<Session> {
  const result = await gql(testApp, { query: LOGIN, variables: { input: { email, password } } });
  if (result.errors.length > 0) {
    throw new Error(`Login as ${email} failed: ${JSON.stringify(result.errors)}`);
  }

  const accessToken = pickString(result.data, 'login', 'accessToken');
  const refreshToken = pickString(result.data, 'login', 'refreshToken');
  return {
    userId: pickString(result.data, 'login', 'user', 'id'),
    accessToken,
    refreshToken,
    cookies: { accessToken, refreshToken },
  };
}
