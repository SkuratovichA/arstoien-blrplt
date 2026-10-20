// Scenarios of openspec/specs/authentication/spec.md about forgotten, reset and changed passwords. Replace each it.todo with a test and keep its title: the title names the scenario.

import bcrypt from 'bcrypt';
import {
  createTestApp,
  DEFAULT_PASSWORD,
  gql,
  loginAs,
  pickString,
  seedUser,
  type TestApp,
  uniqueEmail,
} from '../support/index.js';

const FORGOT_PASSWORD = `
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input)
  }
`;

const RESET_PASSWORD = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;

const CHANGE_PASSWORD = `
  mutation ChangePassword($input: ChangePasswordInputType!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

const NEW_PASSWORD = 'An0ther-Passw0rd!';
const THIRTY_MINUTES = 30 * 60 * 1000;

describe('authentication: passwords', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  // Two logins of one user within the same second sign the same refresh token, which the unique column refuses
  function nextSecond(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1100));
  }

  async function storedHash(userId: string): Promise<string | null> {
    const row = await testApp.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return row.passwordHash;
  }

  async function requestReset(email: string): Promise<string> {
    const result = await gql(testApp, { query: FORGOT_PASSWORD, variables: { input: { email } } });
    expect(result.errors).toEqual([]);
    const link = testApp.emails.lastTo(email, 'password-reset').link;
    return new URL(link).searchParams.get('token') ?? '';
  }

  function reset(token: string, newPassword: string) {
    return gql(testApp, { query: RESET_PASSWORD, variables: { input: { token, newPassword } } });
  }

  function change(bearer: string, currentPassword: string, newPassword: string) {
    return gql(testApp, {
      query: CHANGE_PASSWORD,
      variables: { input: { currentPassword, newPassword } },
      bearer,
    });
  }

  // WHEN a visitor asks for a password reset for the email of an existing account
  // THEN the response is true
  // AND one email goes to that address with a link to the reset-password page that carries a token
  // AND a PASSWORD_RESET token that expires in thirty minutes is stored for the account
  it('Scenario: Forgot password emails a reset link to a known address', async () => {
    const user = await seedUser(testApp.prisma);
    const before = Date.now();

    const result = await gql(testApp, {
      query: FORGOT_PASSWORD,
      variables: { input: { email: user.email } },
    });

    expect(result.errors).toEqual([]);
    expect(result.data).toEqual({ forgotPassword: true });
    expect(testApp.emails.sentTo(user.email, 'password-reset')).toHaveLength(1);
    const link = new URL(testApp.emails.lastTo(user.email, 'password-reset').link);
    expect(link.pathname).toBe('/reset-password');
    const token = link.searchParams.get('token') ?? '';
    expect(token).not.toBe('');
    const stored = await testApp.prisma.verificationToken.findUniqueOrThrow({ where: { token } });
    expect(stored.userId).toBe(user.id);
    expect(stored.type).toBe('PASSWORD_RESET');
    const lifetime = stored.expiresAt.getTime() - before;
    expect(Math.abs(lifetime - THIRTY_MINUTES)).toBeLessThan(60_000);
  });

  // WHEN a visitor asks for a password reset for an email that no account uses
  // THEN the response is true
  // AND no email is sent
  it('Scenario: Forgot password for an unknown address sends nothing', async () => {
    const email = uniqueEmail('nobody');

    const result = await gql(testApp, { query: FORGOT_PASSWORD, variables: { input: { email } } });

    expect(result.errors).toEqual([]);
    expect(result.data).toEqual({ forgotPassword: true });
    expect(testApp.emails.sentTo(email, 'password-reset')).toHaveLength(0);
    expect(testApp.emails.outbox.filter((mail) => mail.to === email)).toHaveLength(0);
  });

  // WHEN a visitor sends a valid reset token and a new password
  // THEN the response is true
  // AND the user can log in with the new password and not with the old one
  // AND the same token is refused when it is used again
  it('Scenario: Reset password with a valid token sets the new password', async () => {
    const user = await seedUser(testApp.prisma);
    const token = await requestReset(user.email);

    const result = await reset(token, NEW_PASSWORD);

    expect(result.errors).toEqual([]);
    expect(result.data).toEqual({ resetPassword: true });
    await expect(loginAs(testApp, user.email, NEW_PASSWORD)).resolves.toMatchObject({
      userId: user.id,
    });
    await expect(loginAs(testApp, user.email, DEFAULT_PASSWORD)).rejects.toThrow();
    const again = await reset(token, 'Yet-Another-Passw0rd!');
    expect(again.errors).toHaveLength(1);
    expect(again.errors[0]?.message).toBe('Invalid or expired reset token');
  });

  // WHEN a visitor sends a reset token that is past its expiry together with a new password
  // THEN the request fails with the message "Reset token has expired"
  // AND the password of the account is unchanged
  it('Scenario: Reset password with an expired token is refused', async () => {
    const user = await seedUser(testApp.prisma);
    const token = await requestReset(user.email);
    const hashBefore = await storedHash(user.id);
    await testApp.prisma.verificationToken.update({
      where: { token },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await reset(token, NEW_PASSWORD);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('Reset token has expired');
    expect(await storedHash(user.id)).toBe(hashBefore);
    await expect(loginAs(testApp, user.email, DEFAULT_PASSWORD)).resolves.toMatchObject({
      userId: user.id,
    });
  });

  // WHEN a signed-in user sends the right current password and a new password of eight characters or more
  // THEN the response reports success
  // AND the user can log in with the new password and not with the old one
  it('Scenario: Changing the password with the right current password succeeds', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);

    const result = await change(session.accessToken, DEFAULT_PASSWORD, NEW_PASSWORD);

    expect(result.errors).toEqual([]);
    expect(pickString(result.data, 'changePassword', 'message')).toBe(
      'Password changed successfully'
    );
    expect(result.data).toMatchObject({ changePassword: { success: true } });
    await nextSecond();
    await expect(loginAs(testApp, user.email, NEW_PASSWORD)).resolves.toMatchObject({
      userId: user.id,
    });
    await expect(loginAs(testApp, user.email, DEFAULT_PASSWORD)).rejects.toThrow();
  });

  // WHEN a signed-in user sends a wrong current password
  // THEN the response reports failure with the message "Current password is incorrect"
  // AND the password of the account is unchanged
  it('Scenario: Changing the password with a wrong current password is refused', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);
    const hashBefore = await storedHash(user.id);

    const result = await change(session.accessToken, 'Wrong-Passw0rd!', NEW_PASSWORD);

    expect(result.errors).toEqual([]);
    expect(result.data).toEqual({
      changePassword: { success: false, message: 'Current password is incorrect' },
    });
    expect(await storedHash(user.id)).toBe(hashBefore);
    expect(await bcrypt.compare(DEFAULT_PASSWORD, hashBefore ?? '')).toBe(true);
  });

  // WHEN a signed-in user sends the right current password and a new password of seven characters
  // THEN the request fails with a validation error
  // AND the password of the account is unchanged
  it('Scenario: A new password shorter than eight characters is refused', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);
    const hashBefore = await storedHash(user.id);

    const result = await change(session.accessToken, DEFAULT_PASSWORD, 'Short-7');

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.message).toMatch(/Validation failed.*newPassword/);
    expect(await storedHash(user.id)).toBe(hashBefore);
    await nextSecond();
    await expect(loginAs(testApp, user.email, DEFAULT_PASSWORD)).resolves.toMatchObject({
      userId: user.id,
    });
  });
});
