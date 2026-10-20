import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Without this the onModuleDestroy hooks (OTP runtime, Prisma, Redis) never run when Docker sends SIGTERM
  app.enableShutdownHooks();
  configureApp(app);
  const configService = app.get(ConfigService);

  const port = configService.get('PORT') ?? 4000;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
