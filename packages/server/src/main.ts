import { NestFactory } from '@nestjs/core';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Cookie parser middleware
  app.use(cookieParser());

  // Configure upload middleware with proper options
  const uploadOptions = {
    maxFileSize: configService.get('app.upload.maxFileSize') ?? 10 * 1024 * 1024, // 10MB
    maxFiles: configService.get('app.upload.maxFiles') ?? 30,
  };
  console.log('🔧 Configuring upload middleware with options:', uploadOptions);
  app.use(graphqlUploadExpress(uploadOptions));

  // Session middleware (required for OAuth state)
  app.use(
    session({
      secret: configService.get('SESSION_SECRET') ?? 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: configService.get('app.environment') === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes (just for OAuth flow)
      },
    })
  );

  // Global validation pipe - skip for GraphQL endpoints as they have their own validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // Don't strip unknown properties for GraphQL
      transform: false, // Don't transform for GraphQL (GraphQL handles its own transformation)
      forbidNonWhitelisted: false,
      validateCustomDecorators: true,
      // Skip validation for GraphQL endpoints
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: true,
      exceptionFactory: (errors) => {
        console.error('❌ Validation failed:', JSON.stringify(errors, null, 2));
        const messages = errors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
          value: error.value,
        }));
        console.error('❌ Detailed validation errors:', JSON.stringify(messages, null, 2));
        return new Error(`Validation failed: ${JSON.stringify(messages)}`);
      },
    })
  );

  // CORS configuration
  const corsConfig = configService.get('app.cors');
  app.enableCors({
    origin: corsConfig.origin,
    credentials: corsConfig.credentials,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight'],
  });

  const port = configService.get('PORT') ?? 4000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🚀 GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
