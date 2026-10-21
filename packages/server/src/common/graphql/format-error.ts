import { ApolloServerErrorCode, unwrapResolverError } from '@apollo/server/errors';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { GraphQLFormattedError } from 'graphql';

/**
 * The extensions.code values that a client switches on. Apollo names BAD_USER_INPUT and INTERNAL_SERVER_ERROR itself; the others name the HTTP statuses that Apollo has no code for.
 */
const ErrorCode = {
  BadUserInput: ApolloServerErrorCode.BAD_USER_INPUT,
  Unauthenticated: 'UNAUTHENTICATED',
  Forbidden: 'FORBIDDEN',
  NotFound: 'NOT_FOUND',
  Conflict: 'CONFLICT',
  RateLimited: 'RATE_LIMITED',
  InternalServerError: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
} as const;

type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * The code of an error by the HTTP status that toHttpException (effect-adapter.ts) gave it. A status that is not in the table is an unexpected failure.
 */
const CODE_BY_STATUS: ReadonlyMap<number, ErrorCode> = new Map<number, ErrorCode>([
  [HttpStatus.BAD_REQUEST, ErrorCode.BadUserInput],
  [HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.BadUserInput],
  [HttpStatus.UNAUTHORIZED, ErrorCode.Unauthenticated],
  [HttpStatus.FORBIDDEN, ErrorCode.Forbidden],
  [HttpStatus.NOT_FOUND, ErrorCode.NotFound],
  [HttpStatus.CONFLICT, ErrorCode.Conflict],
  [HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RateLimited],
]);

/**
 * An error of the response. The code stays at the top level for the readers of the response that predate extensions.code.
 */
export interface FormattedApiError extends GraphQLFormattedError {
  readonly code: string;
}

/** The seconds to wait that toHttpException puts into the body of a rate-limit exception */
function retryAfterSecondsOf(exception: HttpException): number | undefined {
  const body = exception.getResponse();
  if (typeof body === 'object' && 'retryAfterSeconds' in body) {
    return typeof body.retryAfterSeconds === 'number' ? body.retryAfterSeconds : undefined;
  }
  return undefined;
}

/**
 * The code that GraphQL or Apollo put on the error, INTERNAL_SERVER_ERROR when there is none. A resolver that threw something other than an HttpException leaves the code as Apollo made it, and an error that GraphQL raised before a resolver ran, such as GRAPHQL_VALIDATION_FAILED, keeps its own.
 */
function codeOf(formatted: GraphQLFormattedError): string {
  const code = formatted.extensions?.code;
  return typeof code === 'string' ? code : ErrorCode.InternalServerError;
}

/** extensions holds the code and the seconds to wait, and nothing of what Apollo put there, such as the stack trace */
function apiError(
  formatted: GraphQLFormattedError,
  code: string,
  retryAfterSeconds?: number
): FormattedApiError {
  return {
    message: formatted.message,
    code,
    path: formatted.path,
    extensions: { code, ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }) },
  };
}

/**
 * The error of the response for what the resolver threw: the message, the path and the code, in extensions.code and at the top level.
 */
export function formatThrown(formatted: GraphQLFormattedError, thrown: unknown): FormattedApiError {
  if (thrown instanceof HttpException) {
    const code = CODE_BY_STATUS.get(thrown.getStatus()) ?? ErrorCode.InternalServerError;
    return apiError(
      formatted,
      code,
      code === ErrorCode.RateLimited ? retryAfterSecondsOf(thrown) : undefined
    );
  }
  return apiError(formatted, codeOf(formatted));
}

/**
 * formatError of the GraphQL module. Apollo hands over the GraphQLError that wraps the exception of the resolver, and the exception is what carries the status.
 */
export function formatGraphqlError(
  formatted: GraphQLFormattedError,
  error: unknown
): FormattedApiError {
  return formatThrown(formatted, unwrapResolverError(error));
}
