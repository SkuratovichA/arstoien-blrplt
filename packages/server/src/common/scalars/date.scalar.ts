import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

type DateInput = number | string | Date;

function isDateInput(value: unknown): value is DateInput {
  return typeof value === 'number' || typeof value === 'string' || value instanceof Date;
}

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  // value from the client
  parseValue(value: unknown): Date | null {
    return isDateInput(value) ? new Date(value) : null;
  }

  // value sent to the client
  serialize(value: unknown): number | null {
    return isDateInput(value) ? new Date(value).getTime() : null;
  }

  /**
   * Ensures that we accept both string and timestamp dates.
   */
  parseLiteral(ast: ValueNode): Date | null {
    if (ast.kind === Kind.INT) {
      // ast.value is in fact a string number
      return new Date(parseInt(ast.value, 10));
    }
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }

    return null;
  }
}
