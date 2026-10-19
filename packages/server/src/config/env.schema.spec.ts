import { Effect } from 'effect';
import { buildAppConfig } from './app.config.js';
import { decodeEnv, InvalidEnvironmentError, loadEnv } from './env.schema.js';

const required = {
  DATABASE_URL: 'postgresql://user:secret@localhost:5432/blrplt',
  JWT_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
};

describe('loadEnv', () => {
  it('fills the defaults of the variables that are not set', () => {
    const env = loadEnv(required);

    expect(env).toMatchObject({
      NODE_ENV: 'local',
      PORT: 4000,
      HOST: '0.0.0.0',
      REDIS_URL: 'redis://localhost:6379',
      JWT_EXPIRES_IN: '7d',
      JWT_REFRESH_EXPIRES_IN: '90d',
      SMTP_PORT: 1025,
      SMTP_SECURE: 'false',
      S3_BUCKET: 'blrplt-uploads',
    });
    expect(env.SENTRY_DSN).toBeUndefined();
  });

  it('decodes the numbers from their text', () => {
    const env = loadEnv({ ...required, PORT: '8080', SMTP_PORT: '587', SMTP_SECURE: 'true' });

    expect(env).toMatchObject({ PORT: 8080, SMTP_PORT: 587, SMTP_SECURE: 'true' });
  });

  it('treats an empty value as not set', () => {
    const env = loadEnv({ ...required, PORT: '', FRONTEND_URL: '', SENTRY_DSN: '' });

    expect(env).toMatchObject({ PORT: 4000, FRONTEND_URL: 'http://localhost:3000' });
    expect(env.SENTRY_DSN).toBeUndefined();
  });

  it('ignores the variables that the server does not know', () => {
    expect(() => loadEnv({ ...required, HOME: '/home/someone', PATH: '/usr/bin' })).not.toThrow();
  });

  it('reports every missing and invalid variable in one error', () => {
    const error = Effect.runSync(
      Effect.flip(
        decodeEnv({ JWT_SECRET: '', PORT: 'abc', SMTP_PORT: '70000', SMTP_SECURE: 'yes' })
      )
    );

    expect(error).toBeInstanceOf(InvalidEnvironmentError);
    expect(error.problems.map((problem) => problem.split(':')[0]).sort()).toEqual([
      'DATABASE_URL',
      'JWT_REFRESH_SECRET',
      'JWT_SECRET',
      'PORT',
      'SMTP_PORT',
      'SMTP_SECURE',
    ]);
    expect(error.message).toContain('DATABASE_URL');
    expect(error.message).toContain('PORT');
  });

  it.each([
    ['text', 'abc'],
    ['a fraction', '80.5'],
    ['zero', '0'],
    ['a number above 65535', '70000'],
  ])('reports a port that is %s once', (_description, value) => {
    const error = Effect.runSync(Effect.flip(decodeEnv({ ...required, PORT: value })));

    expect(error.problems).toHaveLength(1);
    expect(error.problems[0]).toMatch(/^PORT: /);
  });

  it('throws the same error when the server starts without the required variables', () => {
    let thrown: unknown;
    try {
      loadEnv({});
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(InvalidEnvironmentError);
    expect(thrown instanceof InvalidEnvironmentError && thrown.problems).toHaveLength(3);
  });

  it('does not repeat a secret in the error', () => {
    const error = Effect.runSync(
      Effect.flip(decodeEnv({ ...required, DATABASE_URL: '', PORT: 'abc' }))
    );

    expect(error.message).not.toContain('access-secret');
    expect(error.message).not.toContain('refresh-secret');
  });
});

describe('buildAppConfig', () => {
  it('maps the variables to the settings of the application', () => {
    const config = buildAppConfig(
      loadEnv({
        ...required,
        NODE_ENV: 'production',
        PORT: '3000',
        ALLOWED_REDIRECT_URIS: 'https://a.example.com/cb, https://b.example.com/cb',
        SENTRY_DSN: 'https://sentry.example.com/1',
        SMTP_SECURE: 'true',
        S3_REGION: 'eu-west-1',
      })
    );

    expect(config).toMatchObject({
      environment: 'production',
      port: 3000,
      isProduction: true,
      allowedRedirectUris: ['https://a.example.com/cb', 'https://b.example.com/cb'],
      database: { url: required.DATABASE_URL },
      jwt: { secret: 'access-secret', refreshSecret: 'refresh-secret' },
      sentry: { dsn: 'https://sentry.example.com/1', enabled: true },
      email: { secure: true },
      aws: { region: 'eu-west-1' },
      s3: { region: 'eu-west-1' },
      cookieOptions: { secure: true, sameSite: 'none' },
      graphql: { graphiql: false, introspection: false },
    });
  });

  it('keeps Sentry off outside production even with a DSN', () => {
    const config = buildAppConfig(
      loadEnv({ ...required, SENTRY_DSN: 'https://sentry.example.com/1' })
    );

    expect(config.sentry.enabled).toBe(false);
    expect(config.cookieOptions).toMatchObject({ secure: false, sameSite: 'lax' });
  });
});
