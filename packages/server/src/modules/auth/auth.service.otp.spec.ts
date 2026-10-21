import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Effect } from 'effect';
import {
  DatabaseError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
} from '../../common/effect/index.js';
import { createUser, fixtureDate } from '../../common/testing/fixtures.js';
import {
  type Prisma,
  type RefreshToken,
  type SystemSettings,
  type User,
  UserStatus,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmailService } from '../notification/email.service.js';
import { RefreshTokenService } from '../refresh-token/refresh-token.service.js';
import { UserService } from '../user/user.service.js';
import { AuthService } from './auth.service.js';
import { OtpExpiredError, OtpInvalidError, OtpService } from './otp.service.js';

const settings: SystemSettings = {
  id: 'default',
  supportEmail: 'help@example.com',
  otpAuthEnabled: true,
  updatedBy: null,
  createdAt: fixtureDate,
  updatedAt: fixtureDate,
};

const refreshTokenRecord: RefreshToken = {
  id: 'refresh-1',
  token: 'refresh.jwt',
  userId: 'user-1',
  expiresAt: fixtureDate,
  createdAt: fixtureDate,
};

const prisma = {
  systemSettings: { findFirst: vi.fn<() => Promise<SystemSettings | null>>() },
  user: { update: vi.fn<(args: Prisma.UserUpdateArgs) => Promise<User>>() },
  auditLog: { create: vi.fn<(args: Prisma.AuditLogCreateArgs) => Promise<unknown>>() },
};

const userService = {
  findByEmail: vi.fn<(email: string) => Effect.Effect<User, NotFoundError>>(),
  updateLastLogin: vi.fn<(userId: string) => Effect.Effect<User>>(),
};

const otpService = {
  generateOtp:
    vi.fn<
      (
        userId: string,
        email: string
      ) => Effect.Effect<{ code: string; expiresAt: Date }, RateLimitError | DatabaseError>
    >(),
  validateOtp:
    vi.fn<
      (
        userId: string,
        code: string
      ) => Effect.Effect<void, OtpInvalidError | OtpExpiredError | DatabaseError>
    >(),
};

const emailService = { sendOtpEmail: vi.fn<(email: string, code: string) => Promise<void>>() };

const jwtService = { sign: vi.fn<(payload: object, options?: object) => string>() };

const configService = { get: vi.fn<(key: string) => string | undefined>() };

const refreshTokenService = {
  save: vi.fn<
    (dto: { token: string; userId: string; expiresAt: Date }) => Effect.Effect<RefreshToken>
  >(),
};

const notFound = new NotFoundError({ message: 'User not found', resource: 'User' });

async function createService(): Promise<AuthService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: prisma },
      { provide: UserService, useValue: userService },
      { provide: JwtService, useValue: jwtService },
      { provide: ConfigService, useValue: configService },
      { provide: EmailService, useValue: emailService },
      { provide: RefreshTokenService, useValue: refreshTokenService },
      { provide: OtpService, useValue: otpService },
    ],
  }).compile();

  return moduleRef.get(AuthService);
}

beforeAll(() => {
  // The flow logs a line in every branch; the specs read the results, not the log
  Logger.overrideLogger(false);
});

beforeEach(() => {
  vi.resetAllMocks();
  prisma.systemSettings.findFirst.mockResolvedValue(settings);
  prisma.user.update.mockResolvedValue(createUser());
  prisma.auditLog.create.mockResolvedValue({});
  userService.updateLastLogin.mockReturnValue(Effect.succeed(createUser()));
  otpService.generateOtp.mockReturnValue(
    Effect.succeed({ code: '123456', expiresAt: fixtureDate })
  );
  otpService.validateOtp.mockReturnValue(Effect.void);
  emailService.sendOtpEmail.mockResolvedValue(undefined);
  jwtService.sign.mockReturnValueOnce('access.jwt').mockReturnValueOnce('refresh.jwt');
  configService.get.mockReturnValue('90d');
  refreshTokenService.save.mockReturnValue(Effect.succeed(refreshTokenRecord));
});

describe('AuthService.requestOtpLogin', () => {
  const otpUser = createUser({ otpAuthEnabled: true });

  it('refuses when OTP is switched off for the whole system', async () => {
    prisma.systemSettings.findFirst.mockResolvedValue({ ...settings, otpAuthEnabled: false });
    const service = await createService();

    const error = await Effect.runPromise(Effect.flip(service.requestOtpLogin(otpUser.email)));

    expect(error).toEqual(new UnauthorizedError({ message: 'OTP authentication is not enabled' }));
    expect(otpService.generateOtp).not.toHaveBeenCalled();
  });

  it('refuses when the user has not enabled OTP', async () => {
    userService.findByEmail.mockReturnValue(Effect.succeed(createUser({ otpAuthEnabled: false })));
    const service = await createService();

    const error = await Effect.runPromise(Effect.flip(service.requestOtpLogin(otpUser.email)));

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
  });

  it('refuses an email that no user has, the same way as a user without OTP', async () => {
    userService.findByEmail.mockReturnValue(Effect.fail(notFound));
    const service = await createService();

    const error = await Effect.runPromise(
      Effect.flip(service.requestOtpLogin('nobody@example.com'))
    );

    expect(error).toEqual(new UnauthorizedError({ message: 'OTP authentication is not enabled' }));
  });

  it('gives the answer of a sent code when the user is gone by the second lookup', async () => {
    userService.findByEmail
      .mockReturnValueOnce(Effect.succeed(otpUser))
      .mockReturnValueOnce(Effect.fail(notFound));
    const service = await createService();

    const result = await Effect.runPromise(service.requestOtpLogin(otpUser.email));

    expect(result.success).toBe(true);
    expect(result.message).toBe('If an account exists with this email, an OTP code has been sent');
    expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
  });

  it.each([UserStatus.BLOCKED, UserStatus.SUSPENDED])(
    'sends nothing to a %s user and does not say so',
    async (status) => {
      userService.findByEmail.mockReturnValue(Effect.succeed({ ...otpUser, status }));
      const service = await createService();

      const result = await Effect.runPromise(service.requestOtpLogin(otpUser.email));

      expect(result.message).toBe(
        'If an account exists with this email, an OTP code has been sent'
      );
      expect(otpService.generateOtp).not.toHaveBeenCalled();
      expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
    }
  );

  it('generates a code and mails it to an active user', async () => {
    userService.findByEmail.mockReturnValue(Effect.succeed(otpUser));
    const service = await createService();

    const result = await Effect.runPromise(service.requestOtpLogin(otpUser.email));

    expect(result).toEqual({ success: true, message: 'OTP code has been sent to your email' });
    expect(otpService.generateOtp).toHaveBeenCalledWith(otpUser.id, otpUser.email);
    expect(emailService.sendOtpEmail).toHaveBeenCalledWith(otpUser.email, '123456');
  });

  it('passes the RateLimitError of the code generator on and mails nothing', async () => {
    const limited = new RateLimitError({ message: 'Slow down', retryAfterSeconds: 600 });
    userService.findByEmail.mockReturnValue(Effect.succeed(otpUser));
    otpService.generateOtp.mockReturnValue(Effect.fail(limited));
    const service = await createService();

    const error = await Effect.runPromise(Effect.flip(service.requestOtpLogin(otpUser.email)));

    expect(error).toBe(limited);
    expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
  });

  it('answers a client that asks too often with HTTP 429', async () => {
    userService.findByEmail.mockReturnValue(Effect.succeed(otpUser));
    otpService.generateOtp.mockReturnValue(
      Effect.fail(new RateLimitError({ message: 'Slow down', retryAfterSeconds: 600 }))
    );
    const service = await createService();

    await expect(service.requestOtpLoginAsync(otpUser.email)).rejects.toMatchObject({
      status: 429,
    });
  });
});

describe('AuthService.verifyOtpLogin', () => {
  const user = createUser({ otpAuthEnabled: true });

  it('rejects an email that no user has, without checking any code', async () => {
    userService.findByEmail.mockReturnValue(Effect.fail(notFound));
    const service = await createService();

    const error = await Effect.runPromise(
      Effect.flip(service.verifyOtpLogin('nobody@example.com', '123456'))
    );

    expect(error).toEqual(new UnauthorizedError({ message: 'Invalid OTP code' }));
    expect(otpService.validateOtp).not.toHaveBeenCalled();
  });

  it.each([
    ['a wrong code', new OtpInvalidError({ message: 'Invalid OTP code' })],
    ['an expired code', new OtpExpiredError({ message: 'Expired OTP code' })],
  ])('gives %s one answer', async (_name, failure) => {
    userService.findByEmail.mockReturnValue(Effect.succeed(user));
    otpService.validateOtp.mockReturnValue(Effect.fail(failure));
    const service = await createService();

    const error = await Effect.runPromise(
      Effect.flip(service.verifyOtpLogin(user.email, '000000'))
    );

    expect(error).toEqual(new UnauthorizedError({ message: 'Invalid or expired OTP code' }));
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('does not hide a database failure of the code check behind the invalid code answer', async () => {
    const failure = new DatabaseError({ message: 'connection refused', operation: 'find' });
    userService.findByEmail.mockReturnValue(Effect.succeed(user));
    otpService.validateOtp.mockReturnValue(Effect.fail(failure));
    const service = await createService();

    const error = await Effect.runPromise(
      Effect.flip(service.verifyOtpLogin(user.email, '123456'))
    );

    expect(error).toBe(failure);
  });

  it.each([
    [UserStatus.BLOCKED, 'Account is blocked'],
    [UserStatus.SUSPENDED, 'Account is suspended'],
  ])('refuses a %s user even with the right code', async (status, message) => {
    userService.findByEmail.mockReturnValue(Effect.succeed({ ...user, status }));
    const service = await createService();

    const error = await Effect.runPromise(
      Effect.flip(service.verifyOtpLogin(user.email, '123456'))
    );

    expect(error).toEqual(new UnauthorizedError({ message }));
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('signs the user in with the right code and writes the audit log', async () => {
    userService.findByEmail.mockReturnValue(Effect.succeed(user));
    const service = await createService();

    const result = await Effect.runPromise(service.verifyOtpLogin(user.email, '123456'));

    expect(result).toMatchObject({ user, accessToken: 'access.jwt', refreshToken: 'refresh.jwt' });
    expect(otpService.validateOtp).toHaveBeenCalledWith(user.id, '123456');
    expect(userService.updateLastLogin).toHaveBeenCalledWith(user.id);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: user.id, action: 'OTP_LOGIN_SUCCESS' }),
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('marks the email as verified on the first sign in', async () => {
    userService.findByEmail.mockReturnValue(Effect.succeed({ ...user, emailVerifiedAt: null }));
    const service = await createService();

    await Effect.runPromise(service.verifyOtpLogin(user.email, '123456'));

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });

  it('answers a wrong code with HTTP 401', async () => {
    userService.findByEmail.mockReturnValue(Effect.succeed(user));
    otpService.validateOtp.mockReturnValue(
      Effect.fail(new OtpInvalidError({ message: 'Invalid OTP code' }))
    );
    const service = await createService();

    await expect(service.verifyOtpLoginAsync(user.email, '000000')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid or expired OTP code',
    });
  });
});
