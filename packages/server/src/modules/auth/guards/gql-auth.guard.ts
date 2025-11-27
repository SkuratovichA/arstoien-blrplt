import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from '@modules/auth/decorators';

/**
 * GraphQL authentication guard using JWT
 *
 * This guard:
 * - Extracts the request from GraphQL context
 * - Validates JWT token from Authorization header
 * - Attaches authenticated user to request object
 * - Respects @Public() decorator to skip authentication
 *
 * @example
 * ```typescript
 * // Apply to entire resolver
 * @UseGuards(GqlAuthGuard)
 * @Resolver(() => User)
 * export class UserResolver {
 *   // All methods require auth
 *
 *   @Query(() => User)
 *   @Public() // This one is public
 *   async publicQuery() {}
 * }
 * ```
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Extract request from GraphQL execution context
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  /**
   * Check if endpoint should be public (skip auth)
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
