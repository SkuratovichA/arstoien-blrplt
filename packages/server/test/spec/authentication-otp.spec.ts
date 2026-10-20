// Scenarios of openspec/specs/authentication/spec.md about the login with a one-time code. Replace each it.todo with a test and keep its title: the title names the scenario.
import {
  createTestApp,
  gql,
  pick,
  pickString,
  seedUser,
  type TestApp,
  uniqueEmail,
} from '../support/index.js';

const IS_OTP_ENABLED = 'query ($email: String!) { isOtpEnabled(email: $email) }';
const REQUEST_OTP =
  'mutation ($email: String!) { requestOtpLogin(email: $email) { success message } }';
const VERIFY_OTP = `mutation ($email: String!, $code: String!) {
  verifyOtpLogin(email: $email, code: $code) { accessToken refreshToken user { id email } }
}`;

describe('authentication: one-time code', () => {
  let testApp: TestApp;
  let settingsId: string;
  let previousOtp: boolean;

  /** Turns the system-wide OTP setting on or off; the row is created when the database has none */
  async function setSystemOtp(enabled: boolean): Promise<void> {
    await testApp.prisma.systemSettings.update({
      where: { id: settingsId },
      data: { otpAuthEnabled: enabled },
    });
  }

  beforeAll(async () => {
    testApp = await createTestApp();
    const existing = await testApp.prisma.systemSettings.findFirst();
    const settings =
      existing ??
      (await testApp.prisma.systemSettings.create({
        data: { supportEmail: 'support@example.test', otpAuthEnabled: false },
      }));
    settingsId = settings.id;
    previousOtp = settings.otpAuthEnabled;
  });

  afterAll(async () => {
    await setSystemOtp(previousOtp);
    await testApp.close();
  });

  // WHEN the system-wide OTP setting is off and a client asks whether OTP is enabled for the email of a user whose own preference is on
  // THEN the answer is false
  it('Scenario: OTP is reported as disabled while the system setting is off', async () => {
    await setSystemOtp(false);
    const user = await seedUser(testApp.prisma, { otpAuthEnabled: true });

    const result = await gql(testApp, { query: IS_OTP_ENABLED, variables: { email: user.email } });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'isOtpEnabled')).toBe(false);
  });

  // WHEN the system-wide OTP setting is on and a client asks whether OTP is enabled for the email of a user whose own preference is on
  // THEN the answer is true
  it('Scenario: OTP is reported as enabled when the system setting and the user preference are on', async () => {
    await setSystemOtp(true);
    const user = await seedUser(testApp.prisma, { otpAuthEnabled: true });

    const result = await gql(testApp, { query: IS_OTP_ENABLED, variables: { email: user.email } });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'isOtpEnabled')).toBe(true);
  });

  // WHEN the system-wide OTP setting is on and a client asks whether OTP is enabled for an email that no account uses
  // THEN the answer is false
  it('Scenario: OTP is reported as disabled for an email that no account uses', async () => {
    await setSystemOtp(true);

    const result = await gql(testApp, {
      query: IS_OTP_ENABLED,
      variables: { email: uniqueEmail('nobody') },
    });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'isOtpEnabled')).toBe(false);
  });

  // WHEN a user who may use OTP requests a code for the email of the account
  // THEN the response reports success
  // AND one email with a code of six digits goes to that address
  it('Scenario: Requesting a code emails a six-digit code', async () => {
    await setSystemOtp(true);
    const user = await seedUser(testApp.prisma, { otpAuthEnabled: true });

    const result = await gql(testApp, { query: REQUEST_OTP, variables: { email: user.email } });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'requestOtpLogin', 'success')).toBe(true);
    const sent = testApp.emails.sentTo(user.email, 'otp');
    expect(sent).toHaveLength(1);
    expect(testApp.emails.lastTo(user.email, 'otp').code).toMatch(/^\d{6}$/);
  });

  // WHEN a visitor requests a code for an email that no account uses
  // THEN the response reports failure
  // AND no email is sent
  it('Scenario: Requesting a code for an unknown email sends nothing', async () => {
    await setSystemOtp(true);
    const email = uniqueEmail('nobody');

    const result = await gql(testApp, { query: REQUEST_OTP, variables: { email } });

    expect(result.errors).toEqual([]);
    expect(pick(result.data, 'requestOtpLogin', 'success')).toBe(false);
    expect(testApp.emails.sentTo(email, 'otp')).toHaveLength(0);
    expect(testApp.emails.outbox.filter((mail) => mail.to === email)).toHaveLength(0);
  });

  // WHEN a user submits the email and the code that was emailed
  // THEN the response carries an access token, a refresh token and the user, and the cookies are set
  // AND submitting the same code again fails with the message "Invalid or expired OTP code"
  it('Scenario: A valid code logs the user in and cannot be used twice', async () => {
    await setSystemOtp(true);
    const user = await seedUser(testApp.prisma, { otpAuthEnabled: true });
    await gql(testApp, { query: REQUEST_OTP, variables: { email: user.email } });
    const { code } = testApp.emails.lastTo(user.email, 'otp');

    const login = await gql(testApp, { query: VERIFY_OTP, variables: { email: user.email, code } });

    expect(login.errors).toEqual([]);
    const accessToken = pickString(login.data, 'verifyOtpLogin', 'accessToken');
    const refreshToken = pickString(login.data, 'verifyOtpLogin', 'refreshToken');
    expect(accessToken).not.toBe('');
    expect(refreshToken).not.toBe('');
    expect(login.data).toMatchObject({
      verifyOtpLogin: { user: { id: user.id, email: user.email } },
    });
    expect(login.cookies.accessToken).toBe(accessToken);
    expect(login.cookies.refreshToken).toBe(refreshToken);

    const again = await gql(testApp, { query: VERIFY_OTP, variables: { email: user.email, code } });

    expect(again.errors.map((error) => error.message)).toEqual(['Invalid or expired OTP code']);
    expect(pick(again.data, 'verifyOtpLogin')).toBeFalsy();
  });

  // WHEN a user submits the email together with a code that was never issued
  // THEN the request fails as unauthenticated with the message "Invalid or expired OTP code"
  it('Scenario: A wrong code is refused', async () => {
    await setSystemOtp(true);
    const user = await seedUser(testApp.prisma, { otpAuthEnabled: true });
    await gql(testApp, { query: REQUEST_OTP, variables: { email: user.email } });
    const { code } = testApp.emails.lastTo(user.email, 'otp');
    const wrong = code === '123456' ? '654321' : '123456';

    const result = await gql(testApp, {
      query: VERIFY_OTP,
      variables: { email: user.email, code: wrong },
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Invalid or expired OTP code',
    });
    expect(result.cookies.accessToken).toBeUndefined();
  });

  // WHEN a user submits a code whose five minutes have passed
  // THEN the request fails as unauthenticated with the message "Invalid or expired OTP code"
  // AND the code is gone and cannot be tried again
  it('Scenario: An expired code is refused', async () => {
    await setSystemOtp(true);
    const user = await seedUser(testApp.prisma, { otpAuthEnabled: true });
    await gql(testApp, { query: REQUEST_OTP, variables: { email: user.email } });
    const { code } = testApp.emails.lastTo(user.email, 'otp');
    // The five minutes are stored as the expiry of the code, so the test moves that date into the past
    await testApp.prisma.verificationToken.updateMany({
      where: { userId: user.id, type: 'OTP_LOGIN' },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await gql(testApp, {
      query: VERIFY_OTP,
      variables: { email: user.email, code },
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Invalid or expired OTP code',
    });
    expect(
      await testApp.prisma.verificationToken.count({
        where: { userId: user.id, type: 'OTP_LOGIN' },
      })
    ).toBe(0);

    const retry = await gql(testApp, { query: VERIFY_OTP, variables: { email: user.email, code } });

    expect(retry.errors.map((error) => error.message)).toEqual(['Invalid or expired OTP code']);
  });

  // WHEN an email has made three code requests through the requestOtpLogin mutation in the current window and a client makes a fourth
  // THEN the response carries an error with the code RATE_LIMITED and the seconds to wait in retryAfterSeconds
  // AND the response does not answer with success set to false
  // AND only the three accepted requests sent an email
  it('Scenario: A rejected code request reaches the client as a rate-limit error', async () => {
    await setSystemOtp(true);
    const user = await seedUser(testApp.prisma, { otpAuthEnabled: true });
    for (let request = 1; request <= 3; request += 1) {
      const accepted = await gql(testApp, { query: REQUEST_OTP, variables: { email: user.email } });
      expect(accepted.errors).toEqual([]);
      expect(pick(accepted.data, 'requestOtpLogin', 'success')).toBe(true);
    }

    const rejected = await gql(testApp, { query: REQUEST_OTP, variables: { email: user.email } });

    expect(rejected.errors).toHaveLength(1);
    expect(rejected.errors[0]).toMatchObject({ extensions: { code: 'RATE_LIMITED' } });
    // The window of fifteen minutes opened with the first of the three requests
    const retryAfterSeconds = Number(pick(rejected.errors[0], 'extensions', 'retryAfterSeconds'));
    expect(retryAfterSeconds).toBeGreaterThan(0);
    expect(retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
    expect(pick(rejected.data, 'requestOtpLogin', 'success')).toBeUndefined();
    expect(testApp.emails.sentTo(user.email, 'otp')).toHaveLength(3);
  });
});
