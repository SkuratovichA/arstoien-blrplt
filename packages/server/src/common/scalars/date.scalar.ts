import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  // @ts-ignore - TypeScript version differences in CustomScalar interface
  parseValue(value: number): Date {
    return new Date(value); // value from the client
  }

  // @ts-ignore - TypeScript version differences in CustomScalar interface
  serialize(value: Date): number {
    return new Date(value).getTime(); // value sent to the client
  }

  /**
   * Ensures that we accept both string and timestamp dates.
   */
  // @ts-ignore - TypeScript version differences in CustomScalar interface
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
