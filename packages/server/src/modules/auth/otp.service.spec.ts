import { Test, type TestingModule } from '@nestjs/testing';
import { Effect } from 'effect';
import { TestClock } from 'effect/testing';
import { DatabaseError, RateLimitError } from '../../common/effect/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OtpExpiredError, OtpInvalidError, OtpService } from './otp.service.js';
import { OTP_MAX_REQUESTS_PER_WINDOW } from './otp-rate-limiter.js';

interface StoredToken {
  id: string;
  token: string;
  userId: string;
  type: string;
  expiresAt: Date;
}

interface TokenWhere {
  userId?: string;
  token?: string;
  type?: string;
}

// A small in-memory stand-in for the verificationToken table, so the specs check what the service stores and deletes
function createTokenStore() {
  const tokens: StoredToken[] = [];
  let nextId = 1;

  const matches = (stored: StoredToken, where: TokenWhere) =>
    (where.userId === undefined || stored.userId === where.userId) &&
    (where.token === undefined || stored.token === where.token) &&
    (where.type === undefined || stored.type === where.type);

  const verificationToken = {
    deleteMany: vi.fn(async (args: { where: TokenWhere }) => {
      const doomed = tokens.filter((stored) => matches(stored, args.where));
      for (const stored of doomed) {
        tokens.splice(tokens.indexOf(stored), 1);
      }
      return { count: doomed.length };
    }),
    create: vi.fn(async (args: { data: Omit<StoredToken, 'id'> }) => {
      const stored = { id: `token-${nextId++}`, ...args.data };
      tokens.push(stored);
      return stored;
    }),
    findFirst: vi.fn(async (args: { where: TokenWhere }) => {
      return tokens.find((stored) => matches(stored, args.where)) ?? null;
    }),
    delete: vi.fn(async (args: { where: { id: string } }) => {
      const stored = tokens.find((candidate) => candidate.id === args.where.id);
      if (!stored) {
        throw new Error('Record to delete does not exist');
      }
      tokens.splice(tokens.indexOf(stored), 1);
      return stored;
    }),
  };

  return { tokens, prisma: { verificationToken } };
}

let moduleRef: TestingModule;
let store: ReturnType<typeof createTokenStore>;
let service: OtpService;

// The Effects of the service run on a test clock that starts at 0, which moves the expiry of a code and the rate limit window
function run<A, E>(effect: Effect.Effect<A, E>): Promise<A> {
  return Effect.runPromise(effect.pipe(Effect.provide(TestClock.layer())));
}

beforeEach(async () => {
  store = createTokenStore();
  moduleRef = await Test.createTestingModule({
    providers: [OtpService, { provide: PrismaService, useValue: store.prisma }],
  }).compile();
  service = moduleRef.get(OtpService);
});

afterEach(async () => {
  await moduleRef.close();
});

describe('OtpService.generateOtp', () => {
  it('stores a 6-digit code that is valid for 5 minutes', async () => {
    const result = await run(service.generateOtp('user-1', 'user@example.com'));

    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.expiresAt.getTime()).toBe(5 * 60 * 1000);
    expect(store.tokens).toEqual([
      expect.objectContaining({
        token: result.code,
        userId: 'user-1',
        type: 'OTP_LOGIN',
        expiresAt: result.expiresAt,
      }),
    ]);
  });

  it('replaces the code that the user requested before', async () => {
    const first = await run(service.generateOtp('user-1', 'user@example.com'));
    const second = await run(service.generateOtp('user-1', 'user@example.com'));

    expect(store.tokens).toHaveLength(1);
    expect(store.tokens[0]?.token).toBe(second.code);
    expect(first.expiresAt).toEqual(second.expiresAt);
  });

  it('fails with a RateLimitError after too many requests and stores no new code', async () => {
    for (let i = 0; i < OTP_MAX_REQUESTS_PER_WINDOW; i++) {
      await run(service.generateOtp('user-1', 'user@example.com'));
    }
    const lastCode = store.tokens[0]?.token;

    const error = await run(Effect.flip(service.generateOtp('user-1', 'user@example.com')));

    expect(error).toBeInstanceOf(RateLimitError);
    expect(store.tokens).toHaveLength(1);
    expect(store.tokens[0]?.token).toBe(lastCode);
  });

  it('limits every email on its own', async () => {
    for (let i = 0; i < OTP_MAX_REQUESTS_PER_WINDOW; i++) {
      await run(service.generateOtp('user-1', 'one@example.com'));
    }

    await expect(run(service.generateOtp('user-2', 'two@example.com'))).resolves.toMatchObject({
      code: expect.stringMatching(/^\d{6}$/),
    });
  });

  it('fails with a DatabaseError when the code cannot be stored', async () => {
    store.prisma.verificationToken.create.mockRejectedValueOnce(new Error('connection refused'));

    const error = await run(Effect.flip(service.generateOtp('user-1', 'user@example.com')));

    expect(error).toBeInstanceOf(DatabaseError);
  });
});

describe('OtpService.validateOtp', () => {
  it('accepts the code that was generated, once', async () => {
    const { code } = await run(service.generateOtp('user-1', 'user@example.com'));

    await expect(run(service.validateOtp('user-1', code))).resolves.toBeUndefined();
    expect(store.tokens).toHaveLength(0);

    const error = await run(Effect.flip(service.validateOtp('user-1', code)));
    expect(error).toBeInstanceOf(OtpInvalidError);
  });

  it('rejects a wrong code and keeps the real one valid', async () => {
    const { code } = await run(service.generateOtp('user-1', 'user@example.com'));

    const error = await run(Effect.flip(service.validateOtp('user-1', 'not-the-code')));

    expect(error).toBeInstanceOf(OtpInvalidError);
    await expect(run(service.validateOtp('user-1', code))).resolves.toBeUndefined();
  });

  it("rejects the code of another user's request", async () => {
    const { code } = await run(service.generateOtp('user-1', 'user@example.com'));

    const error = await run(Effect.flip(service.validateOtp('user-2', code)));

    expect(error).toBeInstanceOf(OtpInvalidError);
  });

  it('rejects a code after 5 minutes and deletes it', async () => {
    const error = await run(
      Effect.gen(function* () {
        const { code } = yield* service.generateOtp('user-1', 'user@example.com');
        yield* TestClock.adjust('5 minutes');
        yield* TestClock.adjust(1);
        return yield* Effect.flip(service.validateOtp('user-1', code));
      })
    );

    expect(error).toBeInstanceOf(OtpExpiredError);
    expect(store.tokens).toHaveLength(0);
  });

  it('still accepts the code at the moment it expires', async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const { code } = yield* service.generateOtp('user-1', 'user@example.com');
          yield* TestClock.adjust('5 minutes');
          yield* service.validateOtp('user-1', code);
        })
      )
    ).resolves.toBeUndefined();
  });

  it('fails with a DatabaseError when the table cannot be read', async () => {
    store.prisma.verificationToken.findFirst.mockRejectedValueOnce(new Error('connection refused'));

    const error = await run(Effect.flip(service.validateOtp('user-1', '123456')));

    expect(error).toBeInstanceOf(DatabaseError);
  });
});

describe('OtpService.getRemainingAttempts', () => {
  it('counts down with every code that is generated', async () => {
    const before = await run(service.getRemainingAttempts('user@example.com'));
    await run(service.generateOtp('user-1', 'user@example.com'));
    const after = await run(service.getRemainingAttempts('user@example.com'));

    expect({ before, after }).toEqual({
      before: OTP_MAX_REQUESTS_PER_WINDOW,
      after: OTP_MAX_REQUESTS_PER_WINDOW - 1,
    });
  });
});

describe('OtpService.cleanupUserOtpTokens', () => {
  it('deletes the codes of the user and no other', async () => {
    await run(service.generateOtp('user-1', 'one@example.com'));
    await run(service.generateOtp('user-2', 'two@example.com'));

    await run(service.cleanupUserOtpTokens('user-1'));

    expect(store.tokens.map((stored) => stored.userId)).toEqual(['user-2']);
  });
});
