import { CustomScalar, Scalar } from '@nestjs/graphql';
import { GraphQLError, Kind, ValueNode } from 'graphql';

type DateInput = number | string | Date;

function isDateInput(value: unknown): value is DateInput {
  return typeof value === 'number' || typeof value === 'string' || value instanceof Date;
}

function toValidDate(value: DateInput): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new GraphQLError('Date must be a valid timestamp or ISO date string');
  }

  return date;
}

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  // value from the client
  parseValue(value: unknown): Date {
    if (!isDateInput(value)) {
      throw new GraphQLError('Date must be a timestamp or an ISO date string');
    }

    return toValidDate(value);
  }

  // value sent to the client
  serialize(value: unknown): number | null {
    return isDateInput(value) ? new Date(value).getTime() : null;
  }

  /**
   * Ensures that we accept both string and timestamp dates.
   */
  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      // ast.value is in fact a string number
      return toValidDate(parseInt(ast.value, 10));
    }
    if (ast.kind === Kind.STRING) {
      return toValidDate(ast.value);
    }

    throw new GraphQLError('Date must be a timestamp or an ISO date string', { nodes: ast });
  }
}
