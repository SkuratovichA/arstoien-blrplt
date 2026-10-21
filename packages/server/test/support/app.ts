import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { PubSubService } from '../../src/common/pubsub/pubsub.service.js';
import { LockService } from '../../src/common/services/lock.service.js';
import { EmailService } from '../../src/modules/notification/email.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { FakeEmailService, FakeLockService, FakePubSubService } from './fakes.js';

export interface TestApp {
  app: INestApplication;
  /** The same Prisma client the application uses, connected to the real database */
  prisma: PrismaService;
  emails: FakeEmailService;
  pubSub: FakePubSubService;
  close: () => Promise<void>;
}

/**
 * The whole application (AppModule and configureApp, the setup main.ts uses) on the real database. The email sender and the Redis-backed services are the only providers replaced; nothing listens on a port, requests go through supertest.
 */
export async function createTestApp(): Promise<TestApp> {
  const emails = new FakeEmailService();
  const pubSub = new FakePubSubService();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EmailService)
    .useValue(emails)
    .overrideProvider(PubSubService)
    .useValue(pubSub)
    .overrideProvider(LockService)
    .useValue(new FakeLockService())
    .compile();

  const app = moduleRef.createNestApplication({ logger: ['error', 'warn'] });
  configureApp(app);
  await app.init();

  return { app, prisma: app.get(PrismaService), emails, pubSub, close: () => app.close() };
}
