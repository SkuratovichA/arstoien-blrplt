import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  ConflictException as NestConflictException,
  NotFoundException as NestNotFoundException,
  UnauthorizedException as NestUnauthorizedException,
} from '@nestjs/common';
import { Effect, Match } from 'effect';

import {
  type AppError,
  DatabaseError,
  errorMessage,
  isAppError,
  ValidationError,
} from './errors.js';

const logger = new Logger('EffectAdapter');

/**
 * The HTTP exception for an error of the application. Match.valueTags is exhaustive over the tags of AppError, so an error class without a status here does not compile.
 */
export function toHttpException(error: AppError): HttpException {
  return Match.valueTags(error, {
    // GraphQL shows the first field error as the main message
    ValidationError: (e) => new BadRequestException(e.errors?.[0]?.message ?? e.message),
    NotFoundError: (e) =>
      new NestNotFoundException({ message: e.message, resource: e.resource, id: e.id }),
    UnauthorizedError: (e) => new NestUnauthorizedException(e.message),
    ForbiddenError: (e) => new ForbiddenException({ message: e.message, resource: e.resource }),
    ConflictError: (e) => new NestConflictException({ message: e.message, field: e.field }),
    BusinessLogicError: (e) => new BadRequestException({ message: e.message, code: e.code }),
    DomainError: (e) =>
      new BadRequestException({ message: e.message, code: e.code, metadata: e.metadata }),
    RateLimitError: (e) =>
      new HttpException(
        { message: e.message, retryAfterSeconds: e.retryAfterSeconds },
        HttpStatus.TOO_MANY_REQUESTS
      ),
    ExternalApiError: (e) =>
      new InternalServerErrorException({
        message: `External service error: ${e.service}`,
        details: e.message,
      }),
    DatabaseError: (e) =>
      new InternalServerErrorException({
        message: 'Database operation failed',
        operation: e.operation,
      }),
  });
}

/**
 * Convert whatever an Effect failed with into a NestJS HTTP exception and throw it. Effect.runPromise rejects with the typed error itself (or with the defect), so no wrapper needs unpacking here.
 */
export function mapEffectErrorToHttp(error: unknown): never {
  // Already an HTTP error, for example one that a Nest service raised inside the Effect
  if (error instanceof HttpException) {
    throw error;
  }

  if (isAppError(error)) {
    throw toHttpException(error);
  }

  logger.error('Unexpected error', error instanceof Error ? error.stack : String(error));
  throw new InternalServerErrorException('An unexpected error occurred');
}

/**
 * Run an Effect and convert errors to HTTP exceptions
 * Use this in resolvers/controllers to handle Effect-based service methods
 */
export async function runEffect<A, E>(effect: Effect.Effect<A, E, never>): Promise<A> {
  try {
    return await Effect.runPromise(effect);
  } catch (error) {
    return mapEffectErrorToHttp(error);
  }
}

/**
 * Wrap a promise-returning function to return an Effect
 *
 * This function detects Prisma-specific errors and categorizes them appropriately:
 * - Prisma validation errors (e.g., "Unknown argument") -> ValidationError
 * - Other Prisma/database errors -> DatabaseError
 */
export function promiseToEffect<A>(
  fn: () => Promise<A>,
  mapError?: (error: unknown) => unknown
): Effect.Effect<A, DatabaseError | ValidationError, never> {
  return Effect.tryPromise({
    try: fn,
    catch: (error) => {
      if (mapError) {
        const mapped = mapError(error);
        if (mapped instanceof DatabaseError || mapped instanceof ValidationError) {
          return mapped;
        }
      }

      // Check for Prisma validation errors (e.g., invalid query arguments)
      // These errors occur before the query reaches the database
      if (error instanceof Error) {
        const message = error.message;

        // Detect Prisma validation errors (invalid arguments, schema mismatches, etc.)
        if (
          message.includes('Unknown argument') ||
          message.includes('Invalid argument') ||
          message.includes('Unknown field') ||
          (message.includes('Expected') && message.includes('but got')) ||
          (message.includes('Invalid `') && message.includes('()` invocation'))
        ) {
          return new ValidationError({
            message,
            errors: [{ field: 'query', message }],
          });
        }
      }

      // Default to DatabaseError for other database-related errors
      return new DatabaseError({
        message: errorMessage(error, 'Unknown database error'),
        operation: 'database_operation',
        error,
      });
    },
  });
}
