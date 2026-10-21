// Scenarios of openspec/specs/error-codes/spec.md that a request to the server shows. The two apps hold the scenarios of their side next to their code, and format-error.spec.ts holds the one that only a resolver of the test can force.
import {
  createTestApp,
  type GraphqlResult,
  gql,
  loginAs,
  seedUser,
  type TestApp,
} from '../support/index.js';

const SYSTEM_SETTINGS = `query SystemSettings { systemSettings { id } }`;

const MARK_AS_READ = `
  mutation MarkAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) { id }
  }
`;

const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) { success message }
  }
`;

const MY_NOTIFICATIONS = `query MyNotifications { myNotifications { id } }`;

/** One error that names its kind in extensions.code and at its top level, and sends nothing else in extensions */
function expectOneErrorOfCode(result: GraphqlResult, code: string): void {
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0]?.code).toBe(code);
  expect(result.errors[0]?.extensions).toEqual({ code });
}

describe('error codes', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  // WHEN a signed-in user with the role USER asks for the system settings
  // THEN the response carries one error with the code FORBIDDEN in extensions.code and at its top level
  // AND the extensions of the error hold nothing but the code
  it('Scenario: A user who may not do this is refused as FORBIDDEN', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);

    const result = await gql(testApp, { query: SYSTEM_SETTINGS, bearer: session.accessToken });

    expectOneErrorOfCode(result, 'FORBIDDEN');
  });

  // WHEN a signed-in user marks a notification as read with an id that no notification has
  // THEN the response carries one error with the code NOT_FOUND in extensions.code and at its top level
  // AND the extensions of the error hold nothing but the code
  it('Scenario: Something that does not exist is reported as NOT_FOUND', async () => {
    const user = await seedUser(testApp.prisma);
    const session = await loginAs(testApp, user.email);

    const result = await gql(testApp, {
      query: MARK_AS_READ,
      variables: { notificationId: 'no-notification-has-this-id' },
      bearer: session.accessToken,
    });

    expectOneErrorOfCode(result, 'NOT_FOUND');
  });

  // WHEN a visitor registers with an email address that an account already uses
  // THEN the response carries one error with the code CONFLICT in extensions.code and at its top level
  // AND the extensions of the error hold nothing but the code
  it('Scenario: A request that collides with existing data is reported as CONFLICT', async () => {
    const existing = await seedUser(testApp.prisma);

    const result = await gql(testApp, {
      query: REGISTER,
      variables: {
        input: {
          email: existing.email,
          firstName: 'Ada',
          lastName: 'Lovelace',
          phone: '+420123456789',
        },
      },
    });

    expectOneErrorOfCode(result, 'CONFLICT');
  });

  // WHEN a visitor registers with an email address that is not an address
  // THEN the response carries one error with the code BAD_USER_INPUT in extensions.code and at its top level
  // AND the message names the field email and does not repeat the value that was sent
  // AND no account is created
  it('Scenario: Input that is not valid is reported as BAD_USER_INPUT', async () => {
    const notAnAddress = 'nobody-at-example.test';
    const usersBefore = await testApp.prisma.user.count();

    const result = await gql(testApp, {
      query: REGISTER,
      variables: {
        input: {
          email: notAnAddress,
          firstName: 'Ada',
          lastName: 'Lovelace',
          phone: '+420123456789',
        },
      },
    });

    expectOneErrorOfCode(result, 'BAD_USER_INPUT');
    const message = result.errors[0]?.message ?? '';
    expect(message).toContain('email');
    expect(message).not.toContain(notAnAddress);
    expect(await testApp.prisma.user.count()).toBe(usersBefore);
  });

  // WHEN a visitor without a token asks for the notifications of the current user
  // THEN the response carries one error with the code UNAUTHENTICATED in extensions.code and at its top level
  // AND the extensions of the error hold nothing but the code
  it('Scenario: A request without a token is reported as UNAUTHENTICATED', async () => {
    const result = await gql(testApp, { query: MY_NOTIFICATIONS });

    expectOneErrorOfCode(result, 'UNAUTHENTICATED');
  });

  // WHEN a visitor sends a query that asks for a field that the schema does not have
  // THEN the response carries one error with the code GRAPHQL_VALIDATION_FAILED in extensions.code and at its top level
  // AND the extensions of the error hold nothing but the code
  it('Scenario: A query that GraphQL rejects keeps the code that GraphQL gave it', async () => {
    const result = await gql(testApp, { query: 'query Unknown { noSuchField }' });

    expectOneErrorOfCode(result, 'GRAPHQL_VALIDATION_FAILED');
  });
});
