export type AwsConfig = {
  region: string;
};

export type DatabaseConfig = {
  url: string;
};

export type RedisConfig = {
  url: string;
};

export type JwtConfig = {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
};

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

export type S3Config = {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
};

export type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export type SentryConfig = {
  sendDefaultPii: boolean;
  dsn: string;
  enabled: boolean;
};

export type UploadConfig = {
  maxFileSize: number;
  maxFiles: number;
};

export type GraphqlConfig = {
  playground: boolean;
  introspection: boolean;
};

export type CookieOptionsConfig = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax' | 'strict';
  domain?: string;
};

export type CorsConfig = {
  credentials: boolean;
  origin: string | string[];
};
