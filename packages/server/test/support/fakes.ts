import { Effect } from 'effect';
import type { PubSubService } from '../../src/common/pubsub/pubsub.service.js';
import type { LockService } from '../../src/common/services/lock.service.js';
import type { EmailService } from '../../src/modules/notification/email.service.js';

/**
 * Every email the server tried to send, in order. `data` is the template data of the emails that are built from a template.
 */
export type SentEmail =
  | { kind: 'verification'; to: string; link: string }
  | { kind: 'otp'; to: string; code: string }
  | { kind: 'password-reset'; to: string; link: string }
  | { kind: 'admin-new-user'; to: string; data: Record<string, unknown> }
  | { kind: 'user-verified'; to: string; data: Record<string, unknown> }
  | { kind: 'user-rejected'; to: string; data: Record<string, unknown> }
  | { kind: 'plain'; to: string; subject: string; text: string };

/**
 * Takes the place of EmailService, the provider boundary to the SMTP server: nothing is sent, the outbox keeps what would have been. The `implements` clause makes the compiler fail this file when EmailService gains a public method.
 */
export class FakeEmailService implements Pick<EmailService, keyof EmailService> {
  readonly outbox: SentEmail[] = [];

  /** The emails sent to one address, newest last */
  sentTo<K extends SentEmail['kind']>(to: string, kind: K): Extract<SentEmail, { kind: K }>[] {
    return this.outbox.filter(
      (email): email is Extract<SentEmail, { kind: K }> => email.to === to && email.kind === kind
    );
  }

  /** The newest email of this kind sent to this address, or a failure that names what was sent instead */
  lastTo<K extends SentEmail['kind']>(to: string, kind: K): Extract<SentEmail, { kind: K }> {
    const email = this.sentTo(to, kind).at(-1);
    if (!email) {
      const sent = this.outbox.filter((item) => item.to === to).map((item) => item.kind);
      throw new Error(`No "${kind}" email was sent to ${to}; sent to this address: [${sent}]`);
    }
    return email;
  }

  async sendVerificationEmail(to: string, link: string): Promise<void> {
    this.outbox.push({ kind: 'verification', to, link });
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    this.outbox.push({ kind: 'otp', to, code });
  }

  async sendPasswordResetEmail(to: string, link: string): Promise<void> {
    this.outbox.push({ kind: 'password-reset', to, link });
  }

  sendAdminNewUserNotification(to: string, data: Record<string, unknown>) {
    this.outbox.push({ kind: 'admin-new-user', to, data });
    return Effect.void;
  }

  sendUserVerifiedEmail(to: string, data: Record<string, unknown>) {
    this.outbox.push({ kind: 'user-verified', to, data });
    return Effect.void;
  }

  sendUserRejectedEmail(to: string, data: Record<string, unknown>) {
    this.outbox.push({ kind: 'user-rejected', to, data });
    return Effect.void;
  }

  sendPlainEmail(to: string, subject: string, text: string) {
    this.outbox.push({ kind: 'plain', to, subject, text });
    return Effect.void;
  }
}

/**
 * Takes the place of PubSubService, the provider boundary to Redis: published events are kept, subscriptions end at once.
 */
export class FakePubSubService implements Pick<PubSubService, keyof PubSubService> {
  readonly published: { event: string; payload: unknown }[] = [];

  async publish(event: string, payload: unknown): Promise<void> {
    this.published.push({ event, payload });
  }

  asyncIterator<T>(): AsyncIterator<T> {
    return { next: async () => ({ done: true, value: undefined }) };
  }

  async onModuleDestroy(): Promise<void> {}
}

/**
 * Takes the place of LockService, the provider boundary to Redis: the function runs at once, with no lock held. It covers the run-a-function forms only, which are the ones the application uses.
 */
export class FakeLockService implements Pick<LockService, 'withLock' | 'withLockEffect'> {
  withLock<T>(_resource: string, _ttl: number, fn: () => Promise<T>): Promise<T> {
    return fn();
  }

  withLockEffect<E, R, A>(_resource: string, _ttl: number, fn: Effect.Effect<A, E, R>) {
    return fn;
  }

  async onModuleDestroy(): Promise<void> {}
}
