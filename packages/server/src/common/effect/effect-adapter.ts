import { Effect } from 'effect';
import {
  BadRequestException,
  ConflictException as NestConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException as NestNotFoundException,
  UnauthorizedException as NestUnauthorizedException,
} from '@nestjs/common';

import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ExternalApiError,
  DatabaseError,
  BusinessLogicError,
  DomainError,
} from './errors';

/**
 * Convert Effect errors to NestJS HTTP exceptions
 */
export function mapEffectErrorToHttp(error: unknown): never {
  if (error instanceof ValidationError) {
    // If there are specific field errors, use the first one's message for GraphQL error
    // (GraphQL will show this as the main error message)
    const errorMessage =
      error.errors && error.errors.length > 0 ? error.errors[0]!.message : error.message;

    throw new BadRequestException(errorMessage);
  }

  if (error instanceof NotFoundError) {
    throw new NestNotFoundException({
      message: error.message,
      resource: error.resource,
      id: error.id,
    });
  }

  if (error instanceof UnauthorizedError) {
    throw new NestUnauthorizedException(error.message);
  }

  if (error instanceof ForbiddenError) {
    throw new ForbiddenException({
      message: error.message,
      resource: error.resource,
    });
  }

  if (error instanceof ConflictError) {
    throw new NestConflictException({
      message: error.message,
      field: error.field,
    });
  }

  if (error instanceof BusinessLogicError) {
    throw new BadRequestException({
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof ExternalApiError) {
    throw new InternalServerErrorException({
      message: `External service error: ${error.service}`,
      details: error.message,
    });
  }

  if (error instanceof DatabaseError) {
    throw new InternalServerErrorException({
      message: 'Database operation failed',
      operation: error.operation,
    });
  }

  if (error instanceof DomainError) {
    throw new BadRequestException({
      message: error.message,
      code: error.code,
      metadata: error.metadata,
    });
  }

  // Check if it's a Cause wrapping another error (Effect.js error wrapping)
  if (error && typeof error === 'object') {
    // Try to access the error through Symbol for cause
    const errorObj = error as { _tag?: string; error?: unknown; '[Circular]'?: unknown };

    // Check if it has a [Symbol.for('effect/Cause')] property
    if (errorObj['[Circular]'] === undefined) {
      // Try to find the actual error in the object structure
      if (errorObj._tag === 'Fail' && errorObj.error) {
        // Recursively handle the wrapped error
        return mapEffectErrorToHttp(errorObj.error);
      }
    }

    // Check if error has a cause property (Effect Cause)
    if ('cause' in error && error.cause && typeof error.cause === 'object') {
      const cause = error.cause as { _tag?: string; error?: unknown };

      // Check if the cause has an error property or is the actual error
      if (cause._tag === 'Fail' && cause.error) {
        return mapEffectErrorToHttp(cause.error);
      }

      if ('error' in cause && cause.error) {
        // Recursively handle the wrapped error
        return mapEffectErrorToHttp(cause.error);
      }
    }

    // Check for FiberFailure with message string - parse the error type
    if ('message' in error) {
      const errorMessage = String(error.message);

      // Match "(FiberFailure) ErrorType: message" pattern
      const fiberMatch = errorMessage.match(/\(FiberFailure\)\s+(\w+Error):\s+(.+)/);
      if (fiberMatch) {
        const [, errorType, message] = fiberMatch;

        switch (errorType) {
          case 'ValidationError':
            throw new BadRequestException(message);
          case 'NotFoundError':
            throw new NestNotFoundException(message);
          case 'ForbiddenError':
            throw new ForbiddenException(message);
          case 'BusinessLogicError':
            throw new BadRequestException(message);
          case 'UnauthorizedError':
            throw new NestUnauthorizedException(message);
          case 'ConflictError':
            throw new NestConflictException(message);
        }
      }

      // Try to extract the actual error from FiberFailure messages (fallback)
      if (errorMessage.includes('ValidationError:')) {
        const match = errorMessage.match(/ValidationError:\s*(.+)/);
        if (match) {
          throw new BadRequestException(match[1]);
        }
      }

      if (errorMessage.includes('NotFoundError:')) {
        const match = errorMessage.match(/NotFoundError:\s*(.+)/);
        if (match) {
          throw new NestNotFoundException(match[1]);
        }
      }

      if (errorMessage.includes('ForbiddenError:')) {
        const match = errorMessage.match(/ForbiddenError:\s*(.+)/);
        if (match) {
          throw new ForbiddenException(match[1]);
        }
      }

      if (errorMessage.includes('BusinessLogicError:')) {
        const match = errorMessage.match(/BusinessLogicError:\s*(.+)/);
        if (match) {
          throw new BadRequestException(match[1]);
        }
      }
    }
  }

  // Unknown error
  console.error('Unexpected error:', error);
  throw new InternalServerErrorException('An unexpected error occurred');
}

/**
 * Run an Effect and convert errors to HTTP exceptions
 * Use this in resolvers/controllers to handle Effect-based service methods
 */
export async function runEffect<A, E>(effect: Effect.Effect<A, E, never>): Promise<A> {
  // Catch errors before they become FiberFailure
  const handledEffect = Effect.catchAll(effect, (error) => {
    // Map the error directly - it's not wrapped yet
    mapEffectErrorToHttp(error);
    // This line won't be reached because mapEffectErrorToHttp always throws
    return Effect.fail(error);
  });

  return Effect.runPromise(handledEffect);
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
        const errorMessage = error.message;

        // Detect Prisma validation errors (invalid arguments, schema mismatches, etc.)
        if (
          errorMessage.includes('Unknown argument') ||
          errorMessage.includes('Invalid argument') ||
          errorMessage.includes('Unknown field') ||
          (errorMessage.includes('Expected') && errorMessage.includes('but got')) ||
          (errorMessage.includes('Invalid `') && errorMessage.includes('()` invocation'))
        ) {
          return new ValidationError({
            message: errorMessage,
            errors: [{ field: 'query', message: errorMessage }],
          });
        }

        // Check for Prisma Known Request Errors (P2xxx codes)
        if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
          const prismaError = error as { code: string; meta?: unknown };
          const code = prismaError.code;

          // P2002: Unique constraint violation
          if (code === 'P2002') {
            // This should ideally be ConflictError, but keeping as DatabaseError for now
            // to maintain backwards compatibility
          }

          // P2025: Record not found
          if (code === 'P2025') {
            // This could be NotFoundError, but keeping as DatabaseError for now
          }
        }
      }

      // Default to DatabaseError for other database-related errors
      return new DatabaseError({
        message: error instanceof Error ? error.message : 'Unknown database error',
        operation: 'database_operation',
        error,
      });
    },
  });
}
