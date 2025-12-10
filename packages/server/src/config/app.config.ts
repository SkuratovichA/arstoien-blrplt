import { registerAs } from '@nestjs/config';
import type { CookieOptionsConfig, CorsConfig, DatabaseConfig, EmailConfig, GoogleOAuthConfig, GraphqlConfig, JwtConfig, RedisConfig, S3Config, SentryConfig, UploadConfig, } from './config-types';

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
 * App configuration - consolidated from configuration.ts
 */
export const appConfig = registerAs('app', (): AppConfig => {
  const environment = process.env.NODE_ENV ?? 'local';
  const isProduction = environment === 'production';

  return {
    // Application
    environment,
    port: parseInt(process.env.PORT ?? '4000', 10),
    host: process.env.HOST ?? '0.0.0.0',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    allowedRedirectUris: (
      process.env.ALLOWED_REDIRECT_URIS ??
      'http://localhost:3000/auth/callback,http://localhost:5173/auth/callback'
    )
      .split(',')
      .map((url) => url.trim()),
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
      domain: process.env.APEX_URL,
    },

    // GraphQL
    graphql: {
      playground: !isProduction,
      introspection: !isProduction,
    },

    // Upload
    upload: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    },

    // Sentry
    sentry: {
      dsn: process.env.SENTRY_DSN ?? '',
      enabled: isProduction && !!process.env.SENTRY_DSN,
      sendDefaultPii: true,
    },

    // Database
    database: {
      url: process.env.DATABASE_URL!,
    },

    // Redis
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },

    // JWT
    jwt: {
      secret: process.env.JWT_SECRET!,
      refreshSecret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '90d',
    },

    // Google OAuth
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/auth/google/callback',
    },

    // S3 / MinIO
    s3: {
      endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
      accessKey: process.env.S3_ACCESS_KEY!,
      secretKey: process.env.S3_SECRET_KEY!,
      bucket: process.env.S3_BUCKET ?? 'blrplt-uploads',
      region: process.env.S3_REGION ?? 'us-east-1',
    },

    // Email
    email: {
      host: process.env.SMTP_HOST ?? 'localhost',
      port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.EMAIL_FROM ?? 'noreply@blrplt.com',
    },

    // Admin
    admin: {
      email: process.env.ADMIN_EMAIL ?? 'admin@blrplt.com',
      password: process.env.ADMIN_PASSWORD ?? 'Admin123!',
    },
  } as const;
});
