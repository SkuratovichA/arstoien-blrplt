import { Effect } from 'effect';
import { TestClock } from 'effect/testing';
import { RateLimitError } from '../../common/effect/index.js';
import { OTP_MAX_REQUESTS_PER_WINDOW, OtpRateLimiter } from './otp-rate-limiter.js';

// The test clock starts at 0 and only moves when a test adjusts it, so the window of 15 minutes is exact
function run<A, E>(program: Effect.Effect<A, E, OtpRateLimiter>): Promise<A> {
  return Effect.runPromise(
    program.pipe(Effect.provide(OtpRateLimiter.layer), Effect.provide(TestClock.layer()))
  );
}

function consumeAll(email: string, times: number) {
  return Effect.gen(function* () {
    const limiter = yield* OtpRateLimiter;
    for (let i = 0; i < times; i++) {
      yield* limiter.consume(email);
    }
  });
}

describe('OtpRateLimiter', () => {
  it('lets an email request the maximum number of codes in a window', async () => {
    await expect(run(consumeAll('a@example.com', OTP_MAX_REQUESTS_PER_WINDOW))).resolves.toBe(
      undefined
    );
  });

  it('Scenario: The fourth code request within the window is rejected', async () => {
    const error = await run(
      Effect.gen(function* () {
        const limiter = yield* OtpRateLimiter;
        yield* consumeAll('a@example.com', OTP_MAX_REQUESTS_PER_WINDOW);
        yield* TestClock.adjust('5 minutes');
        return yield* Effect.flip(limiter.consume('a@example.com'));
      })
    );

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.retryAfterSeconds).toBe(10 * 60);
    expect(error.message).toBe('Too many OTP requests. Please try again in 10 minutes.');
  });

  it('does not extend the window when it rejects a request', async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const limiter = yield* OtpRateLimiter;
        yield* consumeAll('a@example.com', OTP_MAX_REQUESTS_PER_WINDOW);
        yield* TestClock.adjust('1 minute');
        yield* Effect.flip(limiter.consume('a@example.com'));
        // The first request is now 15 minutes and 1 millisecond old, so its window has ended although the rejected request came a minute later
        yield* TestClock.adjust('14 minutes');
        yield* TestClock.adjust(1);
        yield* limiter.consume('a@example.com');
        return yield* limiter.remaining('a@example.com');
      })
    );

    expect(remaining).toBe(OTP_MAX_REQUESTS_PER_WINDOW - 1);
  });

  it('keeps the window open until 15 minutes after the first request', async () => {
    const error = await run(
      Effect.gen(function* () {
        const limiter = yield* OtpRateLimiter;
        yield* consumeAll('a@example.com', OTP_MAX_REQUESTS_PER_WINDOW);
        yield* TestClock.adjust('15 minutes');
        return yield* Effect.flip(limiter.consume('a@example.com'));
      })
    );

    expect(error).toBeInstanceOf(RateLimitError);
  });

  it('opens a new window once the old one has ended', async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const limiter = yield* OtpRateLimiter;
        yield* consumeAll('a@example.com', OTP_MAX_REQUESTS_PER_WINDOW);
        yield* TestClock.adjust('16 minutes');
        const before = yield* limiter.remaining('a@example.com');
        yield* limiter.consume('a@example.com');
        const after = yield* limiter.remaining('a@example.com');
        return { before, after };
      })
    );

    expect(remaining).toEqual({
      before: OTP_MAX_REQUESTS_PER_WINDOW,
      after: OTP_MAX_REQUESTS_PER_WINDOW - 1,
    });
  });

  it('counts every email on its own', async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const limiter = yield* OtpRateLimiter;
        yield* consumeAll('a@example.com', OTP_MAX_REQUESTS_PER_WINDOW);
        yield* limiter.consume('b@example.com');
        return {
          a: yield* limiter.remaining('a@example.com'),
          b: yield* limiter.remaining('b@example.com'),
        };
      })
    );

    expect(remaining).toEqual({ a: 0, b: OTP_MAX_REQUESTS_PER_WINDOW - 1 });
  });

  it('keeps counting after the background cleanup has run', async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const limiter = yield* OtpRateLimiter;
        yield* limiter.consume('a@example.com');
        // The cleanup runs every 5 minutes and must not drop a window that is still open
        yield* TestClock.adjust('10 minutes');
        return yield* limiter.remaining('a@example.com');
      })
    );

    expect(remaining).toBe(OTP_MAX_REQUESTS_PER_WINDOW - 1);
  });
});
