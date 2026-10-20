import { ApolloServer } from '@apollo/server';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { RateLimitError, toHttpException, UnauthorizedError } from '../effect/index.js';
import { formatGraphqlError, formatThrown } from './format-error.js';

const PATH = ['requestOtpLogin'];

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

  it('leaves an error of another status as it was shaped before', () => {
    const formatted = {
      message: 'Invalid credentials',
      path: PATH,
      extensions: { code: 'UNAUTHENTICATED' },
    };
    const exception = toHttpException(new UnauthorizedError({ message: 'Invalid credentials' }));

    const result = formatThrown(formatted, exception);

    expect(result).toEqual({ message: 'Invalid credentials', code: 'UNAUTHENTICATED', path: PATH });
    expect(result).not.toHaveProperty('extensions');
  });

  it('keeps the code that Nest gave an exception of its own', () => {
    const formatted = {
      message: 'No session',
      path: PATH,
      extensions: { code: 'UNAUTHENTICATED' },
    };

    expect(formatThrown(formatted, new UnauthorizedException('No session'))).toEqual({
      message: 'No session',
      code: 'UNAUTHENTICATED',
      path: PATH,
    });
  });

  it('answers INTERNAL_SERVER_ERROR for an error that carries no code', () => {
    expect(formatThrown({ message: 'boom' }, new Error('boom'))).toEqual({
      message: 'boom',
      code: 'INTERNAL_SERVER_ERROR',
      path: undefined,
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
});
