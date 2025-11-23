import { Injectable, Logger } from '@nestjs/common';
import { Effect } from 'effect';
import { PrismaService } from '@/prisma/prisma.service';
import { CrudService } from '@/common/services';
import { NotFoundError, DatabaseError, ValidationError, promiseToEffect } from '@/common/effect';
import { Prisma, User, UserRole } from '@prisma/client';

type UserWithCompany = Prisma.UserGetPayload<{ include: { company: true } }>;

@Injectable()
export class UserService extends CrudService<PrismaService['user']> {
  protected readonly logger = new Logger(UserService.name);
  protected readonly modelName = 'User';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.user;
  }

  /**
   * Find user by email
   */
  findByEmail(
    email: string
  ): Effect.Effect<User, ValidationError | NotFoundError | DatabaseError, never> {
    return this.findByUnique({ email });
  }

  /**
   * Find user by Google ID
   */
  findByGoogleId(
    googleId: string
  ): Effect.Effect<User, ValidationError | NotFoundError | DatabaseError, never> {
    return this.findByUnique({ googleId });
  }

  /**
   * Find user by ID with company relation
   */
  findByIdWithCompany(
    id: string
  ): Effect.Effect<UserWithCompany, ValidationError | NotFoundError | DatabaseError, never> {
    return promiseToEffect(() =>
      this.prisma.user
        .findUnique({
          where: { id },
          include: { company: true },
        })
        .then((user) => {
          if (!user) {
            throw new NotFoundError({
              message: `User not found with id: ${id}`,
              resource: this.modelName,
              id,
            });
          }
          return user;
        })
    );
  }

  /**
   * Create user with company relation
   */
  createUserWithCompany(
    data: Prisma.UserCreateInput
  ): Effect.Effect<UserWithCompany, ValidationError | DatabaseError, never> {
    return promiseToEffect(() =>
      this.prisma.user.create({
        data,
        include: { company: true },
      })
    );
  }

  /**
   * Find user by email or Google ID
   */
  findByEmailOrGoogleId(
    email: string,
    googleId: string
  ): Effect.Effect<UserWithCompany | null, ValidationError | DatabaseError, never> {
    return promiseToEffect(() =>
      this.prisma.user.findFirst({
        where: {
          OR: [{ googleId }, { email }],
        },
        include: { company: true },
      })
    );
  }

  /**
   * Update user with company relation
   */
  updateUserWithCompany(
    id: string,
    data: Prisma.UserUpdateInput
  ): Effect.Effect<UserWithCompany, ValidationError | DatabaseError, never> {
    return promiseToEffect(() =>
      this.prisma.user.update({
        where: { id },
        data,
        include: { company: true },
      })
    );
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin(userId: string): Effect.Effect<User, ValidationError | DatabaseError, never> {
    return this.update(userId, {
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Update user password
   */
  updatePassword(
    userId: string,
    passwordHash: string
  ): Effect.Effect<User, ValidationError | DatabaseError, never> {
    return this.update(userId, {
      data: { passwordHash },
    });
  }

  /**
   * Find all active admin users
   */
  findAdmins(): Effect.Effect<Pick<User, 'email'>[], ValidationError | DatabaseError, never> {
    return promiseToEffect(() =>
      this.prisma.user.findMany({
        where: {
          role: {
            in: [UserRole.SUPPORT, UserRole.MODERATOR, UserRole.MANAGER, UserRole.SUPER_ADMIN],
          },
          status: 'ACTIVE',
        },
        select: {
          email: true,
        },
      })
    );
  }
}
