import { registerAs } from '@nestjs/config';
import type {
  AwsConfig,
  CookieOptionsConfig,
  CorsConfig,
  DatabaseConfig,
  EmailConfig,
  GoogleOAuthConfig,
  GraphqlConfig,
  JwtConfig,
  RedisConfig,
  S3Config,
  SentryConfig,
  UploadConfig,
} from './config-types.js';
import { type Env, loadEnv } from './env.schema.js';

export type AppConfig = {
  environment: string;
  port: number;
  host: string;
  frontendUrl: string;
  allowedRedirectUris: string[];
  isProduction: boolean;
  cors: CorsConfig;
  cookieOptions: CookieOptionsConfig;
  graphql: GraphqlConfig;
  upload: UploadConfig;
  sentry: SentryConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  google: GoogleOAuthConfig;
  aws: AwsConfig;
  s3: S3Config;
  email: EmailConfig;
  admin: {
    email: string;
    password: string;
  };
};

export function getCorsUrls(environment: string): string | string[] {
  if (environment === 'local' || environment === 'development') {
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4000',
      'http://localhost:5173', // Admin client
      'http://localhost:5174', // Admin client (alternate port)
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:5173', // Admin client
      'http://127.0.0.1:5174', // Admin client (alternate port)
    ];
  }

  // Production - get from environment variables
  const urls: string[] = [];

  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    // Support multiple URLs separated by comma
    urls.push(...frontendUrl.split(',').map((url) => url.trim()));
  }

  const adminFrontendUrl = process.env.ADMIN_FRONTEND_URL;
  if (adminFrontendUrl) {
    urls.push(...adminFrontendUrl.split(',').map((url) => url.trim()));
  }

  return urls.length > 0 ? urls : [];
}

/**
 * App configuration built from the validated environment variables (see env.schema.ts)
 */
export function buildAppConfig(env: Env): AppConfig {
  const environment = env.NODE_ENV;
  const isProduction = environment === 'production';

  return {
    // Application
    environment,
    port: env.PORT,
    host: env.HOST,
    frontendUrl: env.FRONTEND_URL,
    allowedRedirectUris: env.ALLOWED_REDIRECT_URIS.split(',').map((url) => url.trim()),
    isProduction,

    // CORS
    cors: {
      credentials: true,
      origin: getCorsUrls(environment),
    },

    // Cookies
    cookieOptions: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: env.APEX_URL,
    },

    // GraphQL
    graphql: {
      graphiql: !isProduction,
      introspection: !isProduction,
    },

    // Upload
    upload: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    },

    // Sentry
    sentry: {
      dsn: env.SENTRY_DSN ?? '',
      enabled: isProduction && !!env.SENTRY_DSN,
      sendDefaultPii: true,
    },

    // Database
    database: {
      url: env.DATABASE_URL,
    },

    // Redis
    redis: {
      url: env.REDIS_URL,
    },

    // JWT
    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },

    // Google OAuth
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackUrl: env.GOOGLE_CALLBACK_URL,
    },

    // AWS
    aws: {
      region: env.AWS_REGION ?? env.S3_REGION ?? 'eu-central-1',
    },

    // S3 / MinIO
    s3: {
      endpoint: env.S3_ENDPOINT,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      bucket: env.S3_BUCKET,
      region: env.S3_REGION ?? 'us-east-1',
    },

    // Email
    email: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === 'true',
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.EMAIL_FROM,
    },

    // Admin
    admin: {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    },
  };
}

/**
 * App configuration - consolidated from configuration.ts. The server does not start when a required variable is missing or a variable is invalid.
 */
export const appConfig = registerAs('app', (): AppConfig => buildAppConfig(loadEnv(process.env)));
