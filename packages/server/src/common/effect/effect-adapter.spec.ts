import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { Effect } from 'effect';
import {
  mapEffectErrorToHttp,
  promiseToEffect,
  runEffect,
  toHttpException,
} from './effect-adapter.js';
import {
  type AppError,
  BusinessLogicError,
  ConflictError,
  DatabaseError,
  DomainError,
  ExternalApiError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from './errors.js';

const cases: ReadonlyArray<readonly [AppError, number]> = [
  [new ValidationError({ message: 'Invalid input' }), 400],
  [new BusinessLogicError({ message: 'Not allowed now', code: 'NOT_NOW' }), 400],
  [new DomainError({ message: 'Domain rule', code: 'RULE' }), 400],
  [new UnauthorizedError({ message: 'Login required' }), 401],
  [new ForbiddenError({ message: 'No access', resource: 'Invoice' }), 403],
  [new NotFoundError({ message: 'No such user', resource: 'User', id: '1' }), 404],
  [new ConflictError({ message: 'Email taken', field: 'email' }), 409],
  [new RateLimitError({ message: 'Slow down', retryAfterSeconds: 60 }), 429],
  [new ExternalApiError({ message: 'Timeout', service: 'mailer' }), 500],
  [new DatabaseError({ message: 'Connection lost', operation: 'find' }), 500],
];

describe('toHttpException', () => {
  it.each(cases.map(([error, status]) => ({ tag: error._tag, error, status })))(
    'maps $tag to $status',
    ({ error, status }) => {
      expect(toHttpException(error).getStatus()).toBe(status);
    }
  );

  it('shows the first field error as the message of a validation error', () => {
    const exception = toHttpException(
      new ValidationError({
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is invalid' },
          { field: 'name', message: 'Name is required' },
        ],
      })
    );

    expect(exception.message).toBe('Email is invalid');
  });

  it('keeps the resource and the id of a not found error in the response', () => {
    const exception = toHttpException(
      new NotFoundError({ message: 'No such user', resource: 'User', id: '1' })
    );

    expect(exception.getResponse()).toEqual({ message: 'No such user', resource: 'User', id: '1' });
  });

  it('tells a rate limited client when to retry', () => {
    const exception = toHttpException(
      new RateLimitError({ message: 'Slow down', retryAfterSeconds: 60 })
    );

    expect(exception.getResponse()).toEqual({ message: 'Slow down', retryAfterSeconds: 60 });
  });

  it('does not show the cause of a database error to the client', () => {
    const exception = toHttpException(
      new DatabaseError({ message: 'password authentication failed', operation: 'find' })
    );

    expect(JSON.stringify(exception.getResponse())).not.toContain('password');
  });
});

describe('mapEffectErrorToHttp', () => {
  it('throws an HTTP exception that is already one as it is', () => {
    const original = new NotFoundException('Gone');

    expect(() => mapEffectErrorToHttp(original)).toThrow(original);
  });

  it('answers 500 without details for an error nobody expected', () => {
    let thrown: unknown;
    try {
      mapEffectErrorToHttp(new TypeError('x is not a function'));
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(HttpException);
    expect(thrown instanceof HttpException && thrown.getStatus()).toBe(500);
    expect(thrown instanceof HttpException && thrown.message).toBe('An unexpected error occurred');
  });
});

describe('runEffect', () => {
  it('resolves with the value of the Effect', async () => {
    await expect(runEffect(Effect.succeed(42))).resolves.toBe(42);
  });

  it('rejects with the HTTP exception of a typed failure', async () => {
    await expect(
      runEffect(Effect.fail(new UnauthorizedError({ message: 'Login required' })))
    ).rejects.toMatchObject({ status: 401, message: 'Login required' });
  });

  it('rejects with an HTTP exception that the Effect failed with', async () => {
    await expect(runEffect(Effect.fail(new BadRequestException('Bad page')))).rejects.toMatchObject(
      {
        status: 400,
        message: 'Bad page',
      }
    );
  });

  it('answers 500 for a defect', async () => {
    await expect(
      runEffect(
        Effect.sync(() => {
          throw new Error('boom');
        })
      )
    ).rejects.toMatchObject({ status: 500 });
  });
});

describe('promiseToEffect', () => {
  it('turns a Prisma validation message into a ValidationError', async () => {
    const error = await Effect.runPromise(
      Effect.flip(promiseToEffect(() => Promise.reject(new Error('Unknown argument `foo`'))))
    );

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('turns any other failure into a DatabaseError', async () => {
    const error = await Effect.runPromise(
      Effect.flip(promiseToEffect(() => Promise.reject(new Error('connection refused'))))
    );

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.message).toBe('connection refused');
  });
});
