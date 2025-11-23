import { Effect, pipe } from 'effect';
import type { PrismaService } from '@/prisma/prisma.service';
import type { DatabaseError, ValidationError } from '@/common/effect';
import { NotFoundError, promiseToEffect } from '@/common/effect';
import type { Logger } from '@nestjs/common';

/**
 * Base type for Prisma delegates
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaDelegate = {
  findUnique: (...args: any) => any;
  findFirst: (...args: any) => any;
  findMany: (...args: any) => any;
  create: (...args: any) => any;
  update: (...args: any) => any;
  upsert: (...args: any) => any;
  delete: (...args: any) => any;
  deleteMany: (...args: any) => any;
  count: (...args: any) => any;
};

/**
 * Generic CRUD Service base class using Effect.js with full Prisma type inference
 *
 * This service preserves Prisma's exact type inference for include/select operations.
 * When you use `include` or `select`, the return type will automatically reflect
 * the related data with full type safety.
 *
 * @template TDelegate - The Prisma delegate type (e.g., PrismaClient['user'])
 *
 * @example
 * class UserService extends CrudService<PrismaClient['user']> {
 *   protected getDelegate() {
 *     return this.prisma.user;
 *   }
 *
 *   // Method calls will have exact Prisma types:
 *   const user = yield* this.findById('id'); // Returns User
 *   const userWithPosts = yield* this.findById('id', { include: { posts: true } });
 *   // Returns User & { posts: Post[] } with full type inference
 * }
 */
export abstract class CrudService<TDelegate extends PrismaDelegate> {
  protected abstract readonly logger: Logger;
  protected abstract readonly modelName: string;

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Get the Prisma delegate for the model
   * Must be implemented by child classes
   *
   * @example
   * protected getDelegate() {
   *   return this.prisma.user;
   * }
   */
  protected abstract getDelegate(): TDelegate;

  /**
   * Find entity by ID with full Prisma type inference
   *
   * @example
   * // Without relations
   * const user = yield* this.findById('123'); // Type: User
   *
   * // With relations
   * const userWithPosts = yield* this.findById('123', { include: { posts: true } });
   * // Type: User & { posts: Post[] }
   */
  findById<TArgs extends Parameters<TDelegate['findUnique']>[0] = { where: { id: string } }>(
    id: string,
    args?: Omit<TArgs, 'where'>
  ): Effect.Effect<
    NonNullable<Awaited<ReturnType<TDelegate['findUnique']>>>,
    NotFoundError | DatabaseError | ValidationError,
    never
  > {
    return pipe(
      promiseToEffect(() =>
        this.getDelegate().findUnique({
          where: { id },
          ...args,
        } as TArgs)
      ),
      Effect.flatMap((entity) =>
        entity
          ? Effect.succeed(entity)
          : Effect.fail(
              new NotFoundError({
                message: `${this.modelName} not found`,
                resource: this.modelName,
                id,
              })
            )
      )
    ) as Effect.Effect<
      NonNullable<Awaited<ReturnType<TDelegate['findUnique']>>>,
      NotFoundError | DatabaseError | ValidationError,
      never
    >;
  }

  /**
   * Find entity by unique field with full Prisma type inference
   *
   * @example
   * const user = yield* this.findByUnique({ email: 'test@example.com' });
   * const userWithProfile = yield* this.findByUnique(
   *   { email: 'test@example.com' },
   *   { include: { profile: true } }
   * );
   */
  findByUnique<
    TArgs extends Parameters<TDelegate['findUnique']>[0] & { where: unknown },
    TWhere extends TArgs['where'] = TArgs['where'],
  >(
    where: TWhere,
    args?: Omit<TArgs, 'where'>
  ): Effect.Effect<
    NonNullable<Awaited<ReturnType<TDelegate['findUnique']>>>,
    NotFoundError | DatabaseError | ValidationError,
    never
  > {
    return pipe(
      promiseToEffect(() =>
        this.getDelegate().findUnique({
          where,
          ...args,
        } as TArgs)
      ),
      Effect.flatMap((entity) =>
        entity
          ? Effect.succeed(entity)
          : Effect.fail(
              new NotFoundError({
                message: `${this.modelName} not found`,
                resource: this.modelName,
                id: JSON.stringify(where),
              })
            )
      )
    ) as Effect.Effect<
      NonNullable<Awaited<ReturnType<TDelegate['findUnique']>>>,
      NotFoundError | DatabaseError | ValidationError,
      never
    >;
  }

  /**
   * Find first entity matching criteria
   */
  findFirst<TArgs extends Parameters<TDelegate['findFirst']>[0]>(
    args: TArgs
  ): Effect.Effect<
    Awaited<ReturnType<TDelegate['findFirst']>>,
    DatabaseError | ValidationError,
    never
  > {
    return promiseToEffect(() => this.getDelegate().findFirst(args));
  }

  /**
   * Find many entities with full Prisma type inference
   *
   * @example
   * const users = yield* this.findMany({
   *   where: { status: 'ACTIVE' },
   *   include: { posts: true },
   *   orderBy: { createdAt: 'desc' },
   * });
   * // Type: (User & { posts: Post[] })[]
   */
  findMany<TArgs extends Parameters<TDelegate['findMany']>[0]>(
    args?: TArgs
  ): Effect.Effect<
    Awaited<ReturnType<TDelegate['findMany']>>,
    DatabaseError | ValidationError,
    never
  > {
    return promiseToEffect(() => this.getDelegate().findMany(args));
  }

  /**
   * Count entities
   */
  count<TArgs extends Parameters<TDelegate['count']>[0]>(
    args?: TArgs
  ): Effect.Effect<number, DatabaseError | ValidationError, never> {
    return promiseToEffect(() => this.getDelegate().count(args));
  }

  /**
   * Create entity with full Prisma type inference
   *
   * @example
   * const user = yield* this.create({
   *   data: { email: 'test@example.com', name: 'Test' },
   *   include: { profile: true },
   * });
   * // Type: User & { profile: Profile | null }
   */
  create<TArgs extends Parameters<TDelegate['create']>[0]>(
    args: TArgs
  ): Effect.Effect<
    Awaited<ReturnType<TDelegate['create']>>,
    DatabaseError | ValidationError,
    never
  > {
    return promiseToEffect(() => this.getDelegate().create(args));
  }

  /**
   * Update entity by ID with full Prisma type inference
   *
   * @example
   * const user = yield* this.update('123', {
   *   data: { name: 'New Name' },
   *   include: { posts: true },
   * });
   * // Type: User & { posts: Post[] }
   */
  update<TArgs extends Parameters<TDelegate['update']>[0]>(
    id: string,
    args: Omit<TArgs, 'where'>
  ): Effect.Effect<
    Awaited<ReturnType<TDelegate['update']>>,
    DatabaseError | ValidationError,
    never
  > {
    return promiseToEffect(() =>
      this.getDelegate().update({
        where: { id },
        ...args,
      } as TArgs)
    );
  }

  /**
   * Update entity by unique field
   */
  updateByUnique<
    TArgs extends Parameters<TDelegate['update']>[0] & { where: unknown },
    TWhere extends TArgs['where'] = TArgs['where'],
  >(
    where: TWhere,
    args: Omit<TArgs, 'where'>
  ): Effect.Effect<
    Awaited<ReturnType<TDelegate['update']>>,
    DatabaseError | ValidationError,
    never
  > {
    return promiseToEffect(() =>
      this.getDelegate().update({
        where,
        ...args,
      } as TArgs)
    );
  }

  /**
   * Upsert entity with full Prisma type inference
   */
  upsert<TArgs extends Parameters<TDelegate['upsert']>[0]>(
    args: TArgs
  ): Effect.Effect<
    Awaited<ReturnType<TDelegate['upsert']>>,
    DatabaseError | ValidationError,
    never
  > {
    return promiseToEffect(() => this.getDelegate().upsert(args));
  }

  /**
   * Delete entity by ID
   */
  delete(id: string): Effect.Effect<void, DatabaseError | ValidationError, never> {
    return promiseToEffect(() => this.getDelegate().delete({ where: { id } })).pipe(
      Effect.map(() => undefined)
    );
  }

  /**
   * Delete entity by unique field
   */
  deleteByUnique<
    TArgs extends Parameters<TDelegate['delete']>[0] & { where: unknown },
    TWhere extends TArgs['where'] = TArgs['where'],
  >(where: TWhere): Effect.Effect<void, DatabaseError | ValidationError, never> {
    return promiseToEffect(() => this.getDelegate().delete({ where })).pipe(
      Effect.map(() => undefined)
    );
  }

  /**
   * Delete many entities
   */
  deleteMany<TArgs extends Parameters<TDelegate['deleteMany']>[0]>(
    args?: TArgs
  ): Effect.Effect<{ count: number }, DatabaseError | ValidationError, never> {
    return promiseToEffect(() => this.getDelegate().deleteMany(args));
  }

  /**
   * Check if entity exists
   */
  exists<TArgs extends Parameters<TDelegate['count']>[0]>(
    args?: TArgs
  ): Effect.Effect<boolean, DatabaseError | ValidationError, never> {
    return pipe(
      this.count(args),
      Effect.map((count) => count > 0)
    );
  }

  /**
   * Soft delete entity (sets deletedAt)
   * Only works if model has deletedAt field
   */
  softDelete(id: string): Effect.Effect<void, DatabaseError | ValidationError, never> {
    return promiseToEffect(() =>
      this.getDelegate().update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    ).pipe(Effect.map(() => undefined));
  }

  /**
   * Restore soft deleted entity (sets deletedAt to null)
   * Only works if model has deletedAt field
   */
  restore(id: string): Effect.Effect<void, DatabaseError | ValidationError, never> {
    return promiseToEffect(() =>
      this.getDelegate().update({
        where: { id },
        data: { deletedAt: null },
      })
    ).pipe(Effect.map(() => undefined));
  }

  /**
   * Find with pagination metadata
   */
  findWithPagination<TArgs extends Parameters<TDelegate['findMany']>[0]>(
    args: TArgs & { take?: number; skip?: number }
  ): Effect.Effect<
    {
      data: Awaited<ReturnType<TDelegate['findMany']>>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    },
    DatabaseError | ValidationError,
    never
  > {
    const { take = 10, skip = 0, ...findArgs } = args;
    const page = Math.floor(skip / take) + 1;

    return Effect.gen(this, function* () {
      const [data, total] = yield* Effect.all([
        this.findMany({ ...findArgs, take, skip } as TArgs),
        this.count({ where: (findArgs as { where?: unknown }).where }),
      ]);

      return {
        data,
        total,
        page,
        pageSize: take,
        totalPages: Math.ceil(total / take),
      };
    });
  }
}
