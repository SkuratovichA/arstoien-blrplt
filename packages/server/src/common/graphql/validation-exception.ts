import {
  type ValidationError as ClassValidatorError,
  type HttpException,
  Logger,
} from '@nestjs/common';
import { toHttpException, ValidationError } from '../effect/index.js';

const logger = new Logger('Validation');

interface FieldFailure {
  field: string;
  message: string;
}

/** The failed constraints of class-validator, one per message, a field of a nested input named by its path */
function failuresOf(errors: ClassValidatorError[], parent?: string): FieldFailure[] {
  return errors.flatMap(({ property, constraints, children }) => {
    const field = parent === undefined ? property : `${parent}.${property}`;
    return [
      ...Object.values(constraints ?? {}).map((message) => ({ field, message })),
      ...failuresOf(children ?? [], field),
    ];
  });
}

/**
 * exceptionFactory of the global ValidationPipe: the exception of the status 400 that formatError reports as BAD_USER_INPUT. The constraint messages of class-validator start with the name of the field. Neither the exception nor the log repeats the rejected value, because it can be a password.
 */
export function validationException(errors: ClassValidatorError[]): HttpException {
  const failures = failuresOf(errors);
  const fields = [...new Set(failures.map(({ field }) => field))];
  logger.warn(`Validation failed for ${fields.join(', ')}`);
  return toHttpException(new ValidationError({ message: 'Validation failed', errors: failures }));
}
