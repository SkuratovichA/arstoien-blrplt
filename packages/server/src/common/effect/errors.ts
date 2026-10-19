import { Data } from 'effect';

/**
 * Base error class for domain errors
 */
export class DomainError extends Data.TaggedError('DomainError')<{
  message: string;
  code?: string;
  metadata?: Record<string, unknown>;
}> {}

/**
 * Not Found Error
 */
export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  message: string;
  resource: string;
  id?: string;
}> {}

/**
 * Validation Error
 */
export class ValidationError extends Data.TaggedError('ValidationError')<{
  message: string;
  field?: string;
  errors?: Array<{ field: string; message: string }>;
}> {}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{
  message: string;
}> {}

/**
 * Forbidden Error
 */
export class ForbiddenError extends Data.TaggedError('ForbiddenError')<{
  message: string;
  resource?: string;
}> {}

/**
 * Conflict Error
 */
export class ConflictError extends Data.TaggedError('ConflictError')<{
  message: string;
  field?: string;
}> {}

/**
 * External API Error
 */
export class ExternalApiError extends Data.TaggedError('ExternalApiError')<{
  message: string;
  service: string;
  statusCode?: number;
  response?: unknown;
}> {}

/**
 * Database Error
 */
export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  message: string;
  operation: string;
  error?: unknown;
}> {}

/**
 * Business Logic Error
 */
export class BusinessLogicError extends Data.TaggedError('BusinessLogicError')<{
  message: string;
  code: string;
}> {}

/**
 * Rate Limit Error
 */
export class RateLimitError extends Data.TaggedError('RateLimitError')<{
  message: string;
  retryAfterSeconds: number;
}> {}

/**
 * Every error class above. The union AppError derives from this list, and the HTTP mapping in effect-adapter.ts is exhaustive over it, so a class that joins the list does not compile until it has an HTTP status.
 */
const appErrorClasses = [
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ExternalApiError,
  DatabaseError,
  BusinessLogicError,
  RateLimitError,
] as const;

export type AppError = InstanceType<(typeof appErrorClasses)[number]>;

export function isAppError(error: unknown): error is AppError {
  return appErrorClasses.some((errorClass) => error instanceof errorClass);
}
