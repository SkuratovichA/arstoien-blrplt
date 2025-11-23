import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a resolver/mutation/query as public (skip authentication)
 *
 * @example
 * ```typescript
 * @Query(() => [Listing])
 * @Public()
 * async publicListings() {
 *   return this.listingService.findAll();
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
