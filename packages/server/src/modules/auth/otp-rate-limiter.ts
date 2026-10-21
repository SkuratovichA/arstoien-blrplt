import { Clock, Context, Duration, Effect, Layer, Ref, Schedule } from 'effect';
import { RateLimitError } from '../../common/effect/index.js';

/**
 * OTP requests that one email may make in one window
 */
export const OTP_MAX_REQUESTS_PER_WINDOW = 3;

/**
 * The window opens with the first request of an email and lasts this long
 */
export const OTP_REQUEST_WINDOW = Duration.minutes(15);

/**
 * How often the windows that have ended are dropped from memory
 */
const CLEANUP_INTERVAL = Duration.minutes(5);

const windowMillis = Duration.toMillis(OTP_REQUEST_WINDOW);

interface RequestWindow {
  readonly requests: number;
  /** Epoch milliseconds of the first request in the window */
  readonly startedAt: number;
}

type RequestWindows = ReadonlyMap<string, RequestWindow>;

function isOpen(window: RequestWindow, now: number): boolean {
  return now <= window.startedAt + windowMillis;
}

function openWindow(
  windows: RequestWindows,
  email: string,
  now: number
): RequestWindow | undefined {
  const window = windows.get(email);
  return window !== undefined && isOpen(window, now) ? window : undefined;
}

/**
 * Limits how many OTP codes one email can request in a window. The state lives in the layer, so every consumer of the layer that a runtime built shares it, and the time comes from the Effect Clock, so a test moves it with TestClock.
 *
 * Production keeps the state in memory of one process; a deployment with several instances replaces `layer` with one that talks to Redis and nothing else changes.
 *
 * @example
 * const program = OtpRateLimiter.use((limiter) => limiter.consume('user@example.com'));
 * await Effect.runPromise(program.pipe(Effect.provide(OtpRateLimiter.layer)));
 */
export class OtpRateLimiter extends Context.Service<
  OtpRateLimiter,
  {
    /** Counts one request of the email, and fails with RateLimitError when the open window already holds the maximum */
    readonly consume: (email: string) => Effect.Effect<void, RateLimitError>;
    /** Requests that the email can still make in its open window */
    readonly remaining: (email: string) => Effect.Effect<number>;
  }
>()('blrplt/OtpRateLimiter') {
  static readonly layer = Layer.effect(
    OtpRateLimiter,
    Effect.gen(function* () {
      const windows = yield* Ref.make<RequestWindows>(new Map());

      const consume = Effect.fn('OtpRateLimiter.consume')(function* (email: string) {
        const now = yield* Clock.currentTimeMillis;

        // The check and the count happen in one atomic update; undefined means that the request was counted, a number is the milliseconds until the window ends
        const retryAfterMillis = yield* Ref.modify(
          windows,
          (current): readonly [number | undefined, RequestWindows] => {
            const open = openWindow(current, email, now);

            if (open !== undefined && open.requests >= OTP_MAX_REQUESTS_PER_WINDOW) {
              return [open.startedAt + windowMillis - now, current];
            }

            const counted = new Map(current).set(email, {
              requests: (open?.requests ?? 0) + 1,
              startedAt: open?.startedAt ?? now,
            });
            return [undefined, counted];
          }
        );

        if (retryAfterMillis !== undefined) {
          const minutes = Math.max(1, Math.ceil(retryAfterMillis / 60_000));
          return yield* new RateLimitError({
            message: `Too many OTP requests. Please try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
            retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMillis / 1000)),
          });
        }
      });

      const remaining = Effect.fn('OtpRateLimiter.remaining')(function* (email: string) {
        const now = yield* Clock.currentTimeMillis;
        const current = yield* Ref.get(windows);
        const requests = openWindow(current, email, now)?.requests ?? 0;
        return Math.max(0, OTP_MAX_REQUESTS_PER_WINDOW - requests);
      });

      // Windows that have ended are only dropped from memory here; consume already ignores them. The fiber belongs to the scope of the layer, so disposing the runtime that built the layer stops it.
      const dropEndedWindows = Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis;
        yield* Ref.update(
          windows,
          (current): RequestWindows =>
            new Map([...current].filter(([, window]) => isOpen(window, now)))
        );
      });
      yield* Effect.forkScoped(Effect.repeat(dropEndedWindows, Schedule.spaced(CLEANUP_INTERVAL)));

      return OtpRateLimiter.of({ consume, remaining });
    })
  );
}
