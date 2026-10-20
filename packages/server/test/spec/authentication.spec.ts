// Scenarios of openspec/specs/authentication/spec.md. Replace each it.todo with a test and keep its title: the title names the scenario.
import {
  createTestApp,
  DEFAULT_PASSWORD,
  gql,
  loginAs,
  pick,
  pickString,
  seedUser,
  type TestApp,
  uniqueEmail,
} from '../support/index.js';

const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) { success message }
  }
`;

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) { accessToken refreshToken user { id email } }
  }
`;

const REFRESH = `mutation Refresh { refresh }`;

const LOGOUT = `mutation Logout { logout }`;

const CURRENT_USER = `query CurrentUser { currentUser { id email } }`;

describe('authentication', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  // WHEN a visitor registers with an email address that no account uses, a first name, a last name and a phone number
  // THEN the response reports success and says that an administrator will review the application
  // AND an account with that email exists in the PENDING_APPROVAL status
  // AND no cookie is set
  it('Scenario: Registration creates a pending account', async () => {
    const email = uniqueEmail('register');

    const result = await gql(testApp, {
      query: REGISTER,
      variables: {
        input: { email, firstName: 'Ada', lastName: 'Lovelace', phone: '+420123456789' },
      },
    });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'register', 'success')).toBe(true);
    expect(pickString(result.data, 'register', 'message')).toContain(
      'An administrator will review your application'
    );
    const stored = await testApp.prisma.user.findUnique({ where: { email } });
    expect(stored?.status).toBe('PENDING_APPROVAL');
    expect(result.setCookie).toEqual([]);
  });

  // WHEN a visitor registers with an email address that an account already uses
  // THEN the request fails with the message "User with this email already exists"
  // AND no second account is created
  it('Scenario: Registration with an email that is taken is refused', async () => {
    const existing = await seedUser(testApp.prisma);
    const input = {
      email: existing.email,
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+420123456789',
    };

    const result = await gql(testApp, { query: REGISTER, variables: { input } });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('User with this email already exists');
    expect(await testApp.prisma.user.count({ where: { email: existing.email } })).toBe(1);
  });

  // WHEN a user with an active account logs in with the right email and password
  // THEN the response carries an access token, a refresh token and the user
  // AND the response sets the accessToken and refreshToken cookies as httpOnly
  // AND the last login time of the account is set
  it('Scenario: Login with the right password returns tokens and cookies', async () => {
    const user = await seedUser(testApp.prisma);

    const result = await gql(testApp, {
      query: LOGIN,
      variables: { input: { email: user.email, password: DEFAULT_PASSWORD } },
    });

    expect(result.errors).toEqual([]);
    const accessToken = pickString(result.data, 'login', 'accessToken');
    const refreshToken = pickString(result.data, 'login', 'refreshToken');
    expect(accessToken).not.toBe('');
    expect(refreshToken).not.toBe('');
    expect(pickString(result.data, 'login', 'user', 'id')).toBe(user.id);
    expect(result.cookies).toMatchObject({ accessToken, refreshToken });
    for (const name of ['accessToken', 'refreshToken']) {
      const line = result.setCookie.find((header) => header.startsWith(`${name}=`));
      expect(line).toMatch(/HttpOnly/i);
    }
    const stored = await testApp.prisma.user.findUnique({ where: { id: user.id } });
    expect(stored?.lastLoginAt).toBeInstanceOf(Date);
  });

  // WHEN a user logs in with the right email and a wrong password
  // THEN the request fails as unauthenticated with the message "Invalid credentials"
  // AND no cookie is set
  it('Scenario: Login with a wrong password is refused', async () => {
    const user = await seedUser(testApp.prisma);

    const result = await gql(testApp, {
      query: LOGIN,
      variables: { input: { email: user.email, password: 'Wrong-Passw0rd!' } },
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Invalid credentials',
    });
    expect(result.setCookie).toEqual([]);
  });

  // WHEN a visitor logs in with an email that no account uses
  // THEN the request fails as unauthenticated with the message "Invalid credentials"
  it('Scenario: Login with an unknown email is refused like a wrong password', async () => {
    const result = await gql(testApp, {
      query: LOGIN,
      variables: { input: { email: uniqueEmail('ghost'), password: DEFAULT_PASSWORD } },
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Invalid credentials',
    });
  });

  // WHEN a user whose account is BLOCKED logs in with the right email and password
  // THEN the request fails as unauthenticated with the message "Account is blocked"
  it('Scenario: Login to a blocked account is refused', async () => {
    const user = await seedUser(testApp.prisma, { status: 'BLOCKED' });

    const result = await gql(testApp, {
      query: LOGIN,
      variables: { input: { email: user.email, password: DEFAULT_PASSWORD } },
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Account is blocked',
    });
  });

  // WHEN a user whose account is SUSPENDED logs in with the right email and password
  // THEN the request fails as unauthenticated with the message "Account is suspended"
  it('Scenario: Login to a suspended account is refused', async () => {
    const user = await seedUser(testApp.prisma, { status: 'SUSPENDED' });

    const result = await gql(testApp, {
      query: LOGIN,
      variables: { input: { email: user.email, password: DEFAULT_PASSWORD } },
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Account is suspended',
    });
  });

  // WHEN a client calls refresh with the refreshToken cookie of a logged-in user
  // THEN the response is an access token
  // AND that token authenticates the user on the current-user query
  // AND the accessToken cookie is set
  it('Scenario: Refresh with a valid refresh token issues an access token', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);

    const result = await gql(testApp, {
      query: REFRESH,
      cookies: { refreshToken: session.refreshToken },
    });

    expect(result.errors).toEqual([]);
    const accessToken = pickString(result.data, 'refresh');
    const current = await gql(testApp, { query: CURRENT_USER, bearer: accessToken });
    expect(current.errors).toEqual([]);
    expect(pickString(current.data, 'currentUser', 'id')).toBe(user.id);
    expect(result.cookies.accessToken).toBe(accessToken);
  });

  // WHEN a client calls refresh without a refreshToken cookie
  // THEN the response is null
  // AND the accessToken and refreshToken cookies are cleared
  it('Scenario: Refresh without a refresh token answers null and clears the cookies', async () => {
    const result = await gql(testApp, { query: REFRESH });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'refresh')).toBeNull();
    expect(result.cookies).toMatchObject({ accessToken: '', refreshToken: '' });
  });

  // WHEN a client calls refresh with a refresh token whose stored record was deleted by logout
  // THEN the response is null
  // AND the accessToken and refreshToken cookies are cleared
  it('Scenario: Refresh with a revoked refresh token answers null', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);
    const loggedOut = await gql(testApp, {
      query: LOGOUT,
      cookies: { refreshToken: session.refreshToken },
    });
    expect(loggedOut.errors).toEqual([]);

    const result = await gql(testApp, {
      query: REFRESH,
      cookies: { refreshToken: session.refreshToken },
    });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'refresh')).toBeNull();
    expect(result.cookies).toMatchObject({ accessToken: '', refreshToken: '' });
  });

  // WHEN a logged-in client calls logout with its refreshToken cookie
  // THEN the response is true
  // AND the stored record of that refresh token no longer exists
  // AND the accessToken and refreshToken cookies are cleared
  it('Scenario: Logout deletes the refresh token record and clears the cookies', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);
    expect(
      await testApp.prisma.refreshToken.count({ where: { token: session.refreshToken } })
    ).toBe(1);

    const result = await gql(testApp, { query: LOGOUT, cookies: session.cookies });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'logout')).toBe(true);
    expect(
      await testApp.prisma.refreshToken.count({ where: { token: session.refreshToken } })
    ).toBe(0);
    expect(result.cookies).toMatchObject({ accessToken: '', refreshToken: '' });
  });
});
