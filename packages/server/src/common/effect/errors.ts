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
