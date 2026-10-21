import { ApolloServer } from '@apollo/server';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
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
  toHttpException,
  UnauthorizedError,
  ValidationError,
} from '../effect/index.js';
import { formatGraphqlError, formatThrown } from './format-error.js';

const PATH = ['requestOtpLogin'];

/** What toHttpException makes of each error class, and the code that the response names it with */
const CODE_BY_ERROR: ReadonlyArray<{ error: AppError; code: string }> = [
  { error: new ValidationError({ message: 'Invalid' }), code: 'BAD_USER_INPUT' },
  {
    error: new BusinessLogicError({ message: 'Not now', code: 'NOT_NOW' }),
    code: 'BAD_USER_INPUT',
  },
  { error: new DomainError({ message: 'Rule broken' }), code: 'BAD_USER_INPUT' },
  { error: new UnauthorizedError({ message: 'No session' }), code: 'UNAUTHENTICATED' },
  { error: new ForbiddenError({ message: 'Not yours' }), code: 'FORBIDDEN' },
  {
    error: new NotFoundError({ message: 'Gone', resource: 'Notification' }),
    code: 'NOT_FOUND',
  },
  { error: new ConflictError({ message: 'Taken', field: 'email' }), code: 'CONFLICT' },
  {
    error: new RateLimitError({ message: 'Slow down', retryAfterSeconds: 60 }),
    code: 'RATE_LIMITED',
  },
  {
    error: new ExternalApiError({ message: 'Down', service: 'mailer' }),
    code: 'INTERNAL_SERVER_ERROR',
  },
  {
    error: new DatabaseError({ message: 'Down', operation: 'findMany' }),
    code: 'INTERNAL_SERVER_ERROR',
  },
];

describe('formatThrown', () => {
  it('names the status 429 RATE_LIMITED and carries the seconds to wait', () => {
    const exception = toHttpException(
      new RateLimitError({ message: 'Slow down', retryAfterSeconds: 600 })
    );

    expect(formatThrown({ message: 'Slow down', path: PATH }, exception)).toEqual({
      message: 'Slow down',
      code: 'RATE_LIMITED',
      path: PATH,
      extensions: { code: 'RATE_LIMITED', retryAfterSeconds: 600 },
    });
  });

  it('names the status 429 RATE_LIMITED without a wait when the exception does not state one', () => {
    const exception = new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);

    expect(formatThrown({ message: 'Too many requests', path: PATH }, exception)).toEqual({
      message: 'Too many requests',
      code: 'RATE_LIMITED',
      path: PATH,
      extensions: { code: 'RATE_LIMITED' },
    });
  });

  for (const { error, code } of CODE_BY_ERROR) {
    it(`names the exception of a ${error._tag} ${code}`, () => {
      const result = formatThrown({ message: error.message, path: PATH }, toHttpException(error));

      expect(result.code).toBe(code);
      expect(result.extensions?.code).toBe(code);
    });
  }

  it('names an exception of Nest by its status', () => {
    const formatted = {
      message: 'No session',
      path: PATH,
      extensions: { code: 'UNAUTHENTICATED', stacktrace: ['at somewhere'] },
    };

    expect(formatThrown(formatted, new UnauthorizedException('No session'))).toEqual({
      message: 'No session',
      code: 'UNAUTHENTICATED',
      path: PATH,
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  it('names a status that the table does not hold INTERNAL_SERVER_ERROR', () => {
    const exception = new HttpException('I am a teapot', HttpStatus.I_AM_A_TEAPOT);

    expect(formatThrown({ message: 'I am a teapot', path: PATH }, exception)).toEqual({
      message: 'I am a teapot',
      code: 'INTERNAL_SERVER_ERROR',
      path: PATH,
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  });

  it('sends the seconds to wait for RATE_LIMITED only', () => {
    const exception = new BadRequestException({ message: 'Bad', retryAfterSeconds: 5 });

    expect(formatThrown({ message: 'Bad', path: PATH }, exception).extensions).toEqual({
      code: 'BAD_USER_INPUT',
    });
  });

  it('keeps the code that GraphQL gave an error it raised before a resolver ran', () => {
    const formatted = {
      message: 'Cannot query field "noSuchField" on type "Query".',
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED', stacktrace: ['at somewhere'] },
    };

    expect(formatThrown(formatted, new GraphQLError(formatted.message))).toEqual({
      message: formatted.message,
      code: 'GRAPHQL_VALIDATION_FAILED',
      path: undefined,
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
    });
  });

  it('answers INTERNAL_SERVER_ERROR for an error that carries no code', () => {
    expect(formatThrown({ message: 'boom' }, new Error('boom'))).toEqual({
      message: 'boom',
      code: 'INTERNAL_SERVER_ERROR',
      path: undefined,
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});

describe('formatGraphqlError', () => {
  it('reads the status from the exception that the resolver threw inside the error of Apollo', async () => {
    const server = new ApolloServer({
      typeDefs: 'type Query { limited: Boolean }',
      resolvers: {
        Query: {
          limited: () => {
            throw toHttpException(
              new RateLimitError({ message: 'Slow down', retryAfterSeconds: 90 })
            );
          },
        },
      },
      formatError: formatGraphqlError,
    });

    const response = await server.executeOperation({ query: '{ limited }' });

    if (response.body.kind !== 'single') {
      throw new Error(`Expected a single result, got ${response.body.kind}`);
    }
    expect(response.body.singleResult.errors).toEqual([
      {
        message: 'Slow down',
        code: 'RATE_LIMITED',
        path: ['limited'],
        extensions: { code: 'RATE_LIMITED', retryAfterSeconds: 90 },
      },
    ]);
  });

  // WHEN a resolver fails with an error that no rule names, or with an exception of the status 500
  // THEN the error of the response carries the code INTERNAL_SERVER_ERROR in extensions.code and at its top level
  // AND the extensions of the error hold nothing but the code
  it('Scenario: An unexpected failure is reported as INTERNAL_SERVER_ERROR without its details', async () => {
    const server = new ApolloServer({
      typeDefs: 'type Query { unnamed: Boolean broken: Boolean }',
      resolvers: {
        Query: {
          unnamed: () => {
            throw new Error('boom');
          },
          broken: () => {
            throw toHttpException(
              new DatabaseError({ message: 'connection refused', operation: 'findMany' })
            );
          },
        },
      },
      formatError: formatGraphqlError,
      // Apollo puts the stack trace into the extensions of every error when it is on, and that is the detail the response must not carry
      includeStacktraceInErrorResponses: true,
    });

    const response = await server.executeOperation({ query: '{ unnamed broken }' });

    if (response.body.kind !== 'single') {
      throw new Error(`Expected a single result, got ${response.body.kind}`);
    }
    expect(response.body.singleResult.errors).toEqual([
      {
        message: 'boom',
        code: 'INTERNAL_SERVER_ERROR',
        path: ['unnamed'],
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      },
      {
        message: 'Database operation failed',
        code: 'INTERNAL_SERVER_ERROR',
        path: ['broken'],
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      },
    ]);
  });
});
