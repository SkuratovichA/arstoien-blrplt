# Authentication & Authorization Guide

This guide explains how to use the authentication and authorization system in the Czech Bus Auction Platform.

## Table of Contents
- [Overview](#overview)
- [Guards](#guards)
- [Decorators](#decorators)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The authentication system uses:
- **JWT tokens** for authentication (Bearer tokens in Authorization header)
- **Passport.js** with JWT strategy
- **GraphQL guards** for protecting resolvers
- **Role-based access control** (RBAC)

### Authentication Flow
1. User logs in → receives JWT access token + refresh token
2. Client includes token in `Authorization: Bearer <token>` header
3. JwtStrategy validates token → fetches user from database
4. User object attached to `req.user`
5. Guards check permissions

---

## Guards

### 1. GqlAuthGuard

Validates JWT tokens for GraphQL endpoints.

**Features:**
- Extracts JWT from `Authorization` header
- Validates token using JwtStrategy
- Attaches `User` object to `req.user`
- Respects `@Public()` decorator

**Usage:**
```typescript
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';

@Resolver(() => User)
@UseGuards(GqlAuthGuard) // Apply to entire resolver
export class UserResolver {
  // All methods require authentication

  @Query(() => User)
  async me(@CurrentUser() user: User) {
    return user;
  }
}
```

### 2. RolesGuard

Checks if user has required role(s).

**Features:**
- Works with `@Roles()` decorator
- Allows multiple roles (OR logic)
- Requires user to be authenticated first

**Usage:**
```typescript
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators';
import { UserRole } from '@prisma/client';

@Resolver(() => User)
@UseGuards(GqlAuthGuard, RolesGuard) // Apply both guards
export class AdminResolver {
  @Mutation(() => User)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) // Only these roles
  async approveUser(@Args('id') id: string) {
    // Implementation
  }
}
```

---

## Decorators

### 1. @Public()

Marks an endpoint as public (skips authentication).

**When to use:**
- Login/register mutations
- Public listing queries
- Health checks

**Example:**
```typescript
import { Public } from '@modules/auth/decorators';

@Resolver(() => Listing)
@UseGuards(GqlAuthGuard) // Guard applied to resolver
export class ListingResolver {
  @Query(() => [Listing])
  @Public() // This endpoint is public
  async publicListings() {
    return this.listingService.findPublic();
  }

  @Mutation(() => Listing)
  // This mutation requires auth (no @Public decorator)
  async createListing(@CurrentUser() user: User, @Args('input') input: CreateListingInput) {
    return this.listingService.create(user.id, input);
  }
}
```

### 2. @CurrentUser()

Extracts authenticated user from request.

**Returns:** Full `User` object from database (populated by JwtStrategy)

**Example:**
```typescript
import { CurrentUser } from '@modules/auth/decorators';
import { User } from '@prisma/client';

@Resolver(() => Bid)
@UseGuards(GqlAuthGuard)
export class BiddingResolver {
  @Mutation(() => Bid)
  async placeBid(
    @CurrentUser() user: User, // Injected by decorator
    @Args('input') input: PlaceBidInput,
  ) {
    return this.biddingService.placeBid(user.id, input);
  }
}
```

### 3. @Roles(...roles)

Restricts endpoint to specific user roles.

**Example:**
```typescript
import { Roles } from '@modules/auth/decorators';
import { UserRole } from '@prisma/client';

@Resolver(() => Admin)
@UseGuards(GqlAuthGuard, RolesGuard)
export class AdminResolver {
  @Query(() => [User])
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) // Admin OR Super Admin
  async pendingUsers() {
    return this.userService.findPending();
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.SUPER_ADMIN) // Only Super Admin
  async deleteAllData() {
    return this.adminService.deleteAllData();
  }
}
```

---

## Usage Examples

### Example 1: Public Auth Resolver

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { Public, CurrentUser } from './decorators';
import { LoginInput, RegisterInput } from './dto';
import { AuthResponse } from './types';
import { User } from '@prisma/client';

@Resolver()
@UseGuards(GqlAuthGuard) // Default: require auth
export class AuthResolver {
  constructor(private authService: AuthService) {}

  // Public endpoints
  @Mutation(() => AuthResponse)
  @Public() // Skip auth
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input.email, input.password);
  }

  @Mutation(() => AuthResponse)
  @Public() // Skip auth
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(
      input.email,
      input.password,
      input.firstName,
      input.lastName,
      input.ico
    );
  }

  // Protected endpoints (no @Public)
  @Mutation(() => Boolean)
  async logout(@CurrentUser() user: User) {
    return this.authService.logoutAll(user.id);
  }

  @Mutation(() => Boolean)
  async changePassword(
    @CurrentUser() user: User,
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
  ) {
    await this.authService.changePassword(user.id, oldPassword, newPassword);
    return true;
  }
}
```

### Example 2: Mixed Public/Private Listing Resolver

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Public, CurrentUser, Roles } from '@modules/auth/decorators';
import { ListingService } from './listing.service';
import { Listing } from './entities/listing.entity';
import { CreateListingInput, ListingFilters } from './dto';
import { User, UserRole } from '@prisma/client';

@Resolver(() => Listing)
@UseGuards(GqlAuthGuard, RolesGuard)
export class ListingResolver {
  constructor(private listingService: ListingService) {}

  // Public queries
  @Query(() => [Listing])
  @Public()
  async listings(@Args('filters', { nullable: true }) filters?: ListingFilters) {
    return this.listingService.findAll(filters);
  }

  @Query(() => Listing)
  @Public()
  async listing(@Args('id') id: string) {
    return this.listingService.findById(id);
  }

  // Seller-only mutations
  @Mutation(() => Listing)
  @Roles(UserRole.SELLER)
  async createListing(
    @CurrentUser() user: User,
    @Args('input') input: CreateListingInput,
  ) {
    return this.listingService.create(user.id, input);
  }

  @Mutation(() => Listing)
  @Roles(UserRole.SELLER)
  async updateListing(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('input') input: UpdateListingInput,
  ) {
    return this.listingService.update(id, user.id, input);
  }

  // Admin-only mutations
  @Mutation(() => Listing)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approveListing(@Args('id') id: string) {
    return this.listingService.approve(id);
  }
}
```

### Example 3: Bidding Resolver (Authenticated Only)

```typescript
import { Resolver, Mutation, Subscription, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { CurrentUser } from '@modules/auth/decorators';
import { BiddingService } from './bidding.service';
import { Bid } from './entities/bid.entity';
import { PlaceBidInput } from './dto';
import { User } from '@prisma/client';

@Resolver(() => Bid)
@UseGuards(GqlAuthGuard) // All methods require auth
export class BiddingResolver {
  constructor(private biddingService: BiddingService) {}

  @Mutation(() => Bid)
  async placeBid(
    @CurrentUser() user: User,
    @Args('input') input: PlaceBidInput,
  ) {
    return this.biddingService.placeBid(user.id, input);
  }

  @Mutation(() => Boolean)
  async retractBid(
    @CurrentUser() user: User,
    @Args('bidId') bidId: string,
  ) {
    return this.biddingService.retractBid(bidId, user.id);
  }

  // Subscriptions also require auth
  @Subscription(() => Bid, {
    filter: (payload, variables) => payload.newBid.listingId === variables.listingId,
  })
  async newBid(@Args('listingId') listingId: string) {
    return this.biddingService.subscribeToNewBids(listingId);
  }
}
```

---

## Best Practices

### ✅ DO:

1. **Apply guards at resolver level** when most methods need auth:
   ```typescript
   @UseGuards(GqlAuthGuard)
   @Resolver()
   export class MyResolver {
     @Query() @Public() publicMethod() {} // Opt-out
     @Query() protectedMethod() {} // Requires auth
   }
   ```

2. **Use @Public() for obvious public endpoints**:
   - Login/register
   - Public listing browsing
   - Health checks

3. **Combine guards for role-based access**:
   ```typescript
   @UseGuards(GqlAuthGuard, RolesGuard)
   @Roles(UserRole.ADMIN)
   async adminOnly() {}
   ```

4. **Use CurrentUser for type safety**:
   ```typescript
   async myMethod(@CurrentUser() user: User) {
     // user is typed as Prisma User
   }
   ```

### ❌ DON'T:

1. **Don't forget guards on sensitive endpoints**:
   ```typescript
   // ❌ BAD - no guard!
   @Mutation(() => Boolean)
   async deleteAllUsers() {}

   // ✅ GOOD
   @UseGuards(GqlAuthGuard, RolesGuard)
   @Roles(UserRole.SUPER_ADMIN)
   @Mutation(() => Boolean)
   async deleteAllUsers() {}
   ```

2. **Don't use @Public() on sensitive operations**:
   ```typescript
   // ❌ BAD
   @Mutation(() => User)
   @Public()
   async approveUser(@Args('id') id: string) {}
   ```

3. **Don't access req.user directly** - use @CurrentUser():
   ```typescript
   // ❌ BAD
   async myMethod(@Context() context) {
     const user = context.req.user;
   }

   // ✅ GOOD
   async myMethod(@CurrentUser() user: User) {
     // user is typed and validated
   }
   ```

---

## Global Guard Setup (Optional)

To apply authentication globally (recommended for production):

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlAuthGuard, // Applied to ALL resolvers
    },
  ],
})
export class AppModule {}
```

With global guards:
- **All endpoints require auth by default**
- Use `@Public()` to opt-out
- More secure (opt-out is safer than opt-in)

---

## GraphQL Context

The JWT strategy attaches the user to the request:

```typescript
// After authentication succeeds:
req.user = {
  id: string,
  email: string,
  role: UserRole,
  // ... all User fields from Prisma
}
```

Access via:
- `@CurrentUser()` decorator (recommended)
- `ctx.getContext().req.user` (in field resolvers)

---

## Testing Protected Endpoints

```bash
# Get token
mutation {
  login(input: { email: "test@example.com", password: "password" }) {
    accessToken
    user { id email role }
  }
}

# Use token in subsequent requests
# HTTP Headers:
{
  "Authorization": "Bearer <your-access-token>"
}
```

---

## Role Hierarchy

Current roles (from Prisma schema):
- `BUYER` - Can bid, watch listings
- `SELLER` - Can create listings, all buyer permissions
- `SUPPORT` - Can view reports
- `MODERATOR` - Can approve/reject content
- `MANAGER` - Can manage users
- `SUPER_ADMIN` - Full system access
- `ADMIN` - Administrative access

Use `@Roles()` to restrict by role.
