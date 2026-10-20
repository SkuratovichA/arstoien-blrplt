// Scenarios of openspec/specs/health/spec.md. The second scenario, a database that does not answer, is the unit test in src/modules/health/health.controller.spec.ts: only a double can make the query fail.
import request from 'supertest';
import { createTestApp, pickString, type TestApp } from '../support/index.js';

describe('health', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  // WHEN a client calls GET /health and the database answers
  // THEN the status is 200
  // AND the body holds status ok, database connected and a timestamp in ISO format
  it('Scenario: Health reports ok while the database answers', async () => {
    const response = await request(testApp.app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'connected' });
    const timestamp = pickString(response.body, 'timestamp');
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});
