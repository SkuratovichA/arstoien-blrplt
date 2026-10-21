// Scenarios of openspec/specs/user-profile/spec.md. Replace each it.todo with a test and keep its title: the title names the scenario.
import {
  createTestApp,
  DEFAULT_PASSWORD,
  gql,
  loginAs,
  seedUser,
  type TestApp,
} from '../support/index.js';

const CURRENT_USER = 'query { currentUser { id email firstName lastName status } }';
const UPDATE_PROFILE = `mutation ($input: UpdateProfileInputType!) {
  updateProfile(input: $input) { id firstName lastName bio }
}`;
const DELETE_ACCOUNT = `mutation ($input: DeleteAccountInputType!) {
  deleteAccount(input: $input) { success message }
}`;

describe('user profile', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  // WHEN a client with a valid access token asks for the current user
  // THEN the answer holds the email, the first name, the last name and the status of that account
  it('Scenario: Current user returns the profile of the signed-in user', async () => {
    const user = await seedUser(testApp.prisma, { firstName: 'Ada', lastName: 'Lovelace' });
    const session = await loginAs(testApp, user.email);

    const result = await gql(testApp, { query: CURRENT_USER, bearer: session.accessToken });

    expect(result.errors).toEqual([]);
    expect(result.data).toMatchObject({
      currentUser: {
        id: user.id,
        email: user.email,
        firstName: 'Ada',
        lastName: 'Lovelace',
        status: 'ACTIVE',
      },
    });
  });

  // WHEN a client without an access token asks for the current user
  // THEN the request fails as unauthenticated
  it('Scenario: Current user without a token is refused', async () => {
    const result = await gql(testApp, { query: CURRENT_USER });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(result.data).toMatchObject({ currentUser: null });
  });

  // WHEN a signed-in user updates the first name and the bio
  // THEN the answer holds the new first name and the new bio
  // AND the last name of the account is unchanged
  // AND the stored account holds the new values
  it('Scenario: Updating the profile changes only the fields that were sent', async () => {
    const user = await seedUser(testApp.prisma, {
      firstName: 'Old',
      lastName: 'Keeper',
      bio: 'old bio',
    });
    const session = await loginAs(testApp, user.email);

    const result = await gql(testApp, {
      query: UPDATE_PROFILE,
      variables: { input: { firstName: 'New', bio: 'new bio' } },
      bearer: session.accessToken,
    });

    expect(result.errors).toEqual([]);
    expect(result.data).toMatchObject({
      updateProfile: { id: user.id, firstName: 'New', bio: 'new bio', lastName: 'Keeper' },
    });
    const stored = await testApp.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored).toMatchObject({ firstName: 'New', bio: 'new bio', lastName: 'Keeper' });
  });

  // WHEN a signed-in user updates the first name with 101 characters
  // THEN the request fails with a validation error
  // AND the stored first name is unchanged
  it('Scenario: Updating the profile with a first name over 100 characters is refused', async () => {
    const user = await seedUser(testApp.prisma, { firstName: 'Stable' });
    const session = await loginAs(testApp, user.email);

    const result = await gql(testApp, {
      query: UPDATE_PROFILE,
      variables: { input: { firstName: 'x'.repeat(101) } },
      bearer: session.accessToken,
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('BAD_USER_INPUT');
    expect(result.errors[0]?.message).toContain('firstName');
    const stored = await testApp.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.firstName).toBe('Stable');
  });

  // WHEN a signed-in user sends the right password and a confirmation text other than DELETE MY ACCOUNT
  // THEN the response reports failure with the message "Invalid confirmation text"
  // AND the account keeps its status
  it('Scenario: Deleting the account with the wrong confirmation text is refused', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);

    const result = await gql(testApp, {
      query: DELETE_ACCOUNT,
      variables: { input: { password: DEFAULT_PASSWORD, confirmText: 'delete my account' } },
      bearer: session.accessToken,
    });

    expect(result.errors).toEqual([]);
    expect(result.data).toMatchObject({
      deleteAccount: { success: false, message: 'Invalid confirmation text' },
    });
    const stored = await testApp.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.status).toBe(user.status);
    expect(stored.deletedAt).toBeNull();
  });

  // WHEN a signed-in user sends the right password and the confirmation text DELETE MY ACCOUNT
  // THEN the response reports success
  // AND the account is in the DELETED status with a deletion time and an email that starts with deleted_
  // AND an audit record USER_ACCOUNT_DELETED exists for the account
  it('Scenario: Deleting the account marks it deleted and keeps an audit record', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);

    const result = await gql(testApp, {
      query: DELETE_ACCOUNT,
      variables: { input: { password: DEFAULT_PASSWORD, confirmText: 'DELETE MY ACCOUNT' } },
      bearer: session.accessToken,
    });

    expect(result.errors).toEqual([]);
    expect(result.data).toMatchObject({ deleteAccount: { success: true } });
    const stored = await testApp.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.status).toBe('DELETED');
    expect(stored.deletedAt).toBeInstanceOf(Date);
    expect(stored.email.startsWith('deleted_')).toBe(true);
    const audit = await testApp.prisma.auditLog.findMany({
      where: { userId: user.id, action: 'USER_ACCOUNT_DELETED' },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ entityType: 'User', entityId: user.id });
  });
});
