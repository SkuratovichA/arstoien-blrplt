import { Data, Effect, Schema, SchemaIssue } from 'effect';

/**
 * A variable that falls back to a default. The default is written the way it appears in the environment, so it goes through the same decoding as a value that was set.
 */
const text = (fallback: string) =>
  Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed(fallback)));

// Text that is not a number decodes to NaN, which fails every check; aborting at the first failed check keeps it to one message per port
const port = (fallback: string) =>
  Schema.NumberFromString.check(
    Schema.isFinite().abort(),
    Schema.isInt().abort(),
    Schema.isBetween({ minimum: 1, maximum: 65535 })
  ).pipe(Schema.withDecodingDefault(Effect.succeed(fallback)));

/**
 * The environment variables of the server. A value that is set to an empty string counts as not set, so `.env` lines such as `SENTRY_DSN=` leave the default in place and a required variable cannot be satisfied with an empty value.
 */
export const EnvSchema = Schema.Struct({
  // Application
  NODE_ENV: text('local'),
  PORT: port('4000'),
  HOST: text('0.0.0.0'),
  FRONTEND_URL: text('http://localhost:3000'),
  ALLOWED_REDIRECT_URIS: text(
    'http://localhost:3000/auth/callback,http://localhost:5173/auth/callback'
  ),
  APEX_URL: Schema.optional(Schema.String),
  SENTRY_DSN: Schema.optional(Schema.String),

  // Database and cache
  DATABASE_URL: Schema.NonEmptyString,
  REDIS_URL: text('redis://localhost:6379'),

  // JWT
  JWT_SECRET: Schema.NonEmptyString,
  JWT_REFRESH_SECRET: Schema.NonEmptyString,
  JWT_EXPIRES_IN: text('7d'),
  JWT_REFRESH_EXPIRES_IN: text('90d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: Schema.optional(Schema.String),
  GOOGLE_CLIENT_SECRET: Schema.optional(Schema.String),
  GOOGLE_CALLBACK_URL: text('http://localhost:4000/auth/google/callback'),

  // AWS and S3 / MinIO
  AWS_REGION: Schema.optional(Schema.String),
  S3_REGION: Schema.optional(Schema.String),
  S3_ENDPOINT: text('http://localhost:9000'),
  S3_ACCESS_KEY: text(''),
  S3_SECRET_KEY: text(''),
  S3_BUCKET: text('blrplt-uploads'),

  // Email
  SMTP_HOST: text('localhost'),
  SMTP_PORT: port('1025'),
  SMTP_SECURE: Schema.Literals(['true', 'false']).pipe(
    Schema.withDecodingDefault(Effect.succeed('false'))
  ),
  SMTP_USER: text(''),
  SMTP_PASS: text(''),
  EMAIL_FROM: text('noreply@blrplt.com'),

  // Admin account
  ADMIN_EMAIL: text('admin@blrplt.com'),
  ADMIN_PASSWORD: text('Admin123!'),
});

export type Env = typeof EnvSchema.Type;

/**
 * Every variable that is missing or invalid, in one error. The messages name the variable and what was expected; the secrets (database URL, JWT secrets) can only fail by being missing, so no message repeats a secret.
 */
export class InvalidEnvironmentError extends Data.TaggedError('InvalidEnvironmentError')<{
  message: string;
  problems: ReadonlyArray<string>;
}> {}

function withoutEmptyValues(env: Readonly<Record<string, string | undefined>>) {
  return Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== undefined && value !== '')
  );
}

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();

/**
 * Decode an environment record (usually process.env) into the typed variables of the server
 */
export function decodeEnv(
  env: Readonly<Record<string, string | undefined>>
): Effect.Effect<Env, InvalidEnvironmentError> {
  return Schema.decodeUnknownEffect(EnvSchema)(withoutEmptyValues(env), { errors: 'all' }).pipe(
    Effect.mapError((error) => {
      const problems = formatIssues(error.issue).issues.map(
        ({ path = [], message }) =>
          `${path.map((segment) => String(typeof segment === 'object' ? segment.key : segment)).join('.')}: ${message}`
      );
      return new InvalidEnvironmentError({
        message: `Invalid environment variables:\n${problems.map((problem) => `  ${problem}`).join('\n')}`,
        problems,
      });
    })
  );
}

/**
 * Synchronous form for the startup of the server: returns the variables, or throws the InvalidEnvironmentError that lists all the problems
 */
export function loadEnv(env: Readonly<Record<string, string | undefined>>): Env {
  return Effect.runSync(decodeEnv(env));
}
