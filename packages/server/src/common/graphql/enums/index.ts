/**
 * Centralized GraphQL Enum Registrations
 *
 * All GraphQL enums are registered here to:
 * - Avoid circular dependencies
 * - Centralize enum management
 * - Make enums easy to find and maintain
 * - Ensure consistent enum registration
 *
 * Import this module in your app.module.ts or main.ts to ensure
 * all enums are registered before GraphQL schema generation.
 */

// Export all enums
export * from './notification.enums';
export * from './payment.enums';
export * from './user.enums';
export * from './bidding.enums';
