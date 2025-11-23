import {
  BadRequestException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Effect } from 'effect';
import { AuditLog, Listing, ListingStatus, User, UserStatus } from '@prisma/client';
import { EmailService } from '@modules/notification/email.service';
import { runEffect } from '@/common/effect';
import { AuthService } from '@modules/auth/auth.service';
import { CompanyService } from '@modules/company/company.service';
import { PubSubService, PubSubEvents } from '@common/pubsub/pubsub.service';
import { SettingsService } from '@modules/settings/settings.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private companyService: CompanyService,
    private pubSubService: PubSubService,
    private settingsService: SettingsService
  ) {}

  /**
   * Approve or reject user
   * When approved, sends verification email for password setup
   * User status changes to FRESHLY_CREATED_REQUIRES_PASSWORD
   * User becomes ACTIVE after setting password via verification link
   */
  approveUser(userId: string, approved: boolean, reason?: string): Effect.Effect<User, Error> {
    const self = this;
    return Effect.gen(function* (_) {
      const user = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findUnique({
              where: { id: userId },
              include: { company: true },
            }),
          catch: (error) => new Error(`Failed to find user: ${error}`),
        })
      );

      if (!user) {
        yield* _(Effect.fail(new NotFoundException('User not found')));
      }

      if (user!.status !== UserStatus.PENDING_APPROVAL) {
        yield* _(Effect.fail(new BadRequestException('User is not pending approval')));
      }

      // When approved: PENDING_APPROVAL → FRESHLY_CREATED_REQUIRES_PASSWORD
      // When rejected: PENDING_APPROVAL → REJECTED
      const newStatus = approved
        ? UserStatus.FRESHLY_CREATED_REQUIRES_PASSWORD
        : UserStatus.REJECTED;

      const updated = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.update({
              where: { id: userId },
              data: {
                status: newStatus,
                ...(reason && { rejectionReason: reason }),
              },
            }),
          catch: (error) => new Error(`Failed to update user: ${error}`),
        })
      );

      // Send email notification (fire and forget - don't block on email sending)
      if (approved) {
        // Generate verification token and send verification email
        // User will set their password and become ACTIVE
        (async () => {
          try {
            const verificationToken = await self.authService.generateVerificationToken(updated.id);
            await self.authService.sendVerificationEmail(updated.email, verificationToken);
          } catch (error) {
            // Log error but don't fail the approval
            console.error('Failed to send verification email:', error);
          }
        })();
      } else {
        runEffect(
          self.emailService.sendUserRejectedEmail(updated.email, {
            firstName: updated.firstName,
            lastName: updated.lastName,
            reason: reason ?? 'Váš účet nesplňuje požadavky platformy.',
          })
        ).catch(() => {});
      }

      // Publish pending counts update for admin notifications (fire and forget)
      self.publishPendingCountsUpdate().catch((error) => {
        console.error('Failed to publish pending counts update:', error);
      });

      return updated;
    });
  }

  /**
   * Update pending user information before approval
   * Allows admin to edit user and company contact fields
   */
  updatePendingUser(
    userId: string,
    companyPhone?: string,
    companyEmail?: string,
    companyWebsite?: string
  ): Effect.Effect<User, Error> {
    const self = this;
    return Effect.gen(function* (_) {
      // Find user with company
      const user = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findUnique({
              where: { id: userId },
              include: { company: true },
            }),
          catch: (error) => new Error(`Failed to find user: ${error}`),
        })
      );

      if (!user) {
        yield* _(Effect.fail(new NotFoundException('User not found')));
      }

      if (user!.status !== UserStatus.PENDING_APPROVAL) {
        yield* _(Effect.fail(new BadRequestException('User is not pending approval')));
      }

      // Update company contact fields if company exists
      if (
        user!.companyId &&
        (companyPhone !== undefined || companyEmail !== undefined || companyWebsite !== undefined)
      ) {
        yield* _(
          Effect.tryPromise({
            try: () =>
              self.prisma.company.update({
                where: { id: user!.companyId! },
                data: {
                  ...(companyPhone !== undefined && { phone: companyPhone || null }),
                  ...(companyEmail !== undefined && { email: companyEmail || null }),
                  ...(companyWebsite !== undefined && { website: companyWebsite || null }),
                },
              }),
            catch: (error) => new Error(`Failed to update company: ${error}`),
          })
        );
      }

      // Re-fetch user to return updated data
      const updatedUser = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findUnique({
              where: { id: userId },
              include: { company: true },
            }),
          catch: (error) => new Error(`Failed to fetch updated user: ${error}`),
        })
      );

      if (!updatedUser) {
        yield* _(Effect.fail(new Error('Failed to fetch updated user')));
      }

      return updatedUser!;
    });
  }

  /**
   * Retry ARES API lookup for a user with aresError
   * Fetches company data from ARES and updates user/company
   */
  retryAresLookup(userId: string): Effect.Effect<User, Error> {
    const self = this;
    return Effect.gen(function* (_) {
      // Find user
      const user = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findUnique({
              where: { id: userId },
              include: { company: true },
            }),
          catch: (error) => new Error(`Failed to find user: ${error}`),
        })
      );

      if (!user) {
        yield* _(Effect.fail(new NotFoundException('User not found')));
      }

      if (user!.status !== UserStatus.PENDING_APPROVAL) {
        yield* _(Effect.fail(new BadRequestException('User is not pending approval')));
      }

      // Extract ICO from company or error message
      let ico: string | null = null;
      if (user!.company?.ico) {
        ico = user!.company.ico;
      } else if (user!.aresError) {
        // Try to extract ICO from error message or previous data
        // For now, we'll require admin to provide the ICO
        yield* _(Effect.fail(new BadRequestException('Cannot retry ARES lookup: no ICO found')));
      }

      if (!ico) {
        yield* _(
          Effect.fail(new BadRequestException('Cannot retry ARES lookup: no ICO available'))
        );
      }

      // Try to fetch company from ARES
      const aresCheckedAt = new Date();
      let companyId: string | undefined;
      let aresError: string | undefined;

      try {
        const company = yield* _(self.companyService.verifyCompanyByIco(ico!));
        companyId = company.id;
      } catch (error) {
        aresError =
          error instanceof Error ? error.message : 'Failed to fetch company data from ARES';
      }

      // Update user with ARES result
      const updatedUser = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.update({
              where: { id: userId },
              data: {
                aresError,
                aresCheckedAt,
                ...(companyId && {
                  companyId,
                }),
              },
              include: { company: true },
            }),
          catch: (error) => new Error(`Failed to update user: ${error}`),
        })
      );

      return updatedUser;
    });
  }

  /**
   * Request manual document verification for a user
   * Sends email to support team and marks user as documents requested
   */
  requestUserDocuments(userId: string): Effect.Effect<{ success: boolean; message: string }, Error> {
    const self = this;
    return Effect.gen(function* (_) {
      // Find user with company
      const user = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findUnique({
              where: { id: userId },
              include: { company: true },
            }),
          catch: (error) => new Error(`Failed to find user: ${error}`),
        })
      );

      if (!user) {
        yield* _(Effect.fail(new NotFoundException('User not found')));
      }

      if (user!.status !== UserStatus.PENDING_APPROVAL) {
        yield* _(Effect.fail(new BadRequestException('User is not pending approval')));
      }

      // Check if documents were already requested
      if (user!.documentsRequestedAt) {
        yield* _(Effect.fail(new BadRequestException('Documents have already been requested for this user')));
      }

      // Get support email from settings
      const supportEmail = yield* _(
        Effect.tryPromise({
          try: () => self.settingsService.getSupportEmail(),
          catch: (error) => new Error(`Failed to get support email: ${error}`),
        })
      );

      // Determine reason for document request
      let reason = '';
      if (!user!.company && !user!.aresError) {
        reason = 'Neposkytli jste IČO při registraci. Pro ověření podnikatelského oprávnění potřebujeme dokumenty.';
      } else if (user!.aresError) {
        reason = 'Automatické ověření IČO přes ARES API selhalo. Pro pokračování potřebujeme ověřit vaše dokumenty.';
      } else {
        reason = 'Pro dokončení registrace potřebujeme ověřit vaše podnikatelské dokumenty.';
      }

      // Send email to user asking them to provide documents
      yield* _(
        self.emailService.sendUserDocumentRequestEmail(user!.email, {
          firstName: user!.firstName,
          lastName: user!.lastName,
          supportEmail,
          reason,
          aresError: user!.aresError || '',
          missingIco: !user!.company?.ico,
        })
      );

      // Update user to mark documents as requested
      yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.update({
              where: { id: userId },
              data: {
                documentsRequestedAt: new Date(),
              },
            }),
          catch: (error) => new Error(`Failed to update user: ${error}`),
        })
      );

      return {
        success: true,
        message: 'Document verification request sent to support team',
      };
    });
  }

  /**
   * Approve or reject listing
   */
  approveListing(
    listingId: string,
    approved: boolean,
    reason?: string
  ): Effect.Effect<Listing, Error> {
    const self = this;
    return Effect.gen(function* (_) {
      const listing = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.listing.findUnique({
              where: { id: listingId },
              include: { seller: true },
            }),
          catch: (error) => new Error(`Failed to find listing: ${error}`),
        })
      );

      if (!listing) {
        yield* _(Effect.fail(new NotFoundException('Listing not found')));
      }

      if (listing!.status !== ListingStatus.PENDING_APPROVAL) {
        yield* _(Effect.fail(new BadRequestException('Listing is not pending approval')));
      }

      const newStatus = approved
        ? listing!.startsAt <= new Date()
          ? ListingStatus.ACTIVE
          : ListingStatus.SCHEDULED
        : ListingStatus.REJECTED;

      const updated = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.listing.update({
              where: { id: listingId },
              data: {
                status: newStatus,
                approvedAt: approved ? new Date() : null,
                ...(reason && { rejectionReason: reason }),
              },
              include: { seller: true },
            }),
          catch: (error) => new Error(`Failed to update listing: ${error}`),
        })
      );

      // Send email notification (fire and forget)
      if (approved) {
        runEffect(
          self.emailService.sendListingApprovedEmail(updated.seller.email, {
            listingTitle: updated.title,
            listingUrl: `/listing/${updated.slug}`,
            status: newStatus === ListingStatus.ACTIVE ? 'aktivní' : 'naplánován',
          })
        ).catch(() => {});
      } else {
        runEffect(
          self.emailService.sendListingRejectedEmail(updated.seller.email, {
            listingTitle: updated.title,
            reason: reason ?? 'Inzerát nesplňuje pravidla platformy.',
          })
        ).catch(() => {});
      }

      // Publish pending counts update for admin notifications (fire and forget)
      self.publishPendingCountsUpdate().catch((error) => {
        console.error('Failed to publish pending counts update:', error);
      });

      return updated;
    });
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, status: UserStatus): Effect.Effect<User, Error> {
    const self = this;
    return Effect.gen(function* (_) {
      const user = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findUnique({
              where: { id: userId },
            }),
          catch: (error) => new Error(`Failed to find user: ${error}`),
        })
      );

      if (!user) {
        yield* _(Effect.fail(new NotFoundException('User not found')));
      }

      return yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.update({
              where: { id: userId },
              data: { status },
            }),
          catch: (error) => new Error(`Failed to update user status: ${error}`),
        })
      );
    });
  }

  /**
   * Get pending users
   */
  getPendingUsers(): Effect.Effect<User[], Error> {
    return Effect.tryPromise({
      try: () =>
        this.prisma.user.findMany({
          where: { status: UserStatus.PENDING_APPROVAL },
          orderBy: { createdAt: 'desc' },
        }),
      catch: (error) => new Error(`Failed to fetch pending users: ${error}`),
    });
  }

  /**
   * Get pending listings
   */
  getPendingListings(): Effect.Effect<Listing[], Error> {
    return Effect.tryPromise({
      try: () =>
        this.prisma.listing.findMany({
          where: { status: ListingStatus.PENDING_APPROVAL },
          orderBy: { createdAt: 'desc' },
          include: {
            seller: {
              include: {
                company: true,
              },
            },
            images: true,
            euroClass: true,
          },
        }),
      catch: (error) => new Error(`Failed to fetch pending listings: ${error}`),
    });
  }

  /**
   * Get admin statistics
   */
  getStatistics(): Effect.Effect<
    {
      pendingUsers: number;
      pendingListings: number;
      activeAuctions: number;
      todayRegistrations: number;
      todayTransactions: number;
      todayRevenue: number;
      totalUsers: number;
      totalListings: number;
    },
    Error
  > {
    const self = this;
    return Effect.gen(function* (_) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        pendingUsers,
        pendingListings,
        activeAuctions,
        todayRegistrations,
        todayTransactions,
        totalUsers,
        totalListings,
      ] = yield* _(
        Effect.all([
          Effect.tryPromise({
            try: () =>
              self.prisma.user.count({
                where: { status: UserStatus.PENDING_APPROVAL },
              }),
            catch: () => new Error('Failed to count pending users'),
          }),
          Effect.tryPromise({
            try: () =>
              self.prisma.listing.count({
                where: { status: ListingStatus.PENDING_APPROVAL },
              }),
            catch: () => new Error('Failed to count pending listings'),
          }),
          Effect.tryPromise({
            try: () =>
              self.prisma.listing.count({
                where: { status: ListingStatus.ACTIVE },
              }),
            catch: () => new Error('Failed to count active auctions'),
          }),
          Effect.tryPromise({
            try: () =>
              self.prisma.user.count({
                where: { createdAt: { gte: today } },
              }),
            catch: () => new Error('Failed to count today registrations'),
          }),
          Effect.tryPromise({
            try: () =>
              self.prisma.transaction.count({
                where: { createdAt: { gte: today } },
              }),
            catch: () => new Error('Failed to count today transactions'),
          }),
          Effect.tryPromise({
            try: () => self.prisma.user.count(),
            catch: () => new Error('Failed to count total users'),
          }),
          Effect.tryPromise({
            try: () => self.prisma.listing.count(),
            catch: () => new Error('Failed to count total listings'),
          }),
        ])
      );

      // Calculate today's revenue
      const todayRevenue = yield* _(
        Effect.tryPromise({
          try: async () => {
            const transactions = await self.prisma.transaction.findMany({
              where: {
                createdAt: { gte: today },
                paymentStatus: 'PAID',
              },
            });
            return transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
          },
          catch: () => new Error('Failed to calculate revenue'),
        })
      );

      return {
        pendingUsers,
        pendingListings,
        activeAuctions,
        todayRegistrations,
        todayTransactions,
        todayRevenue,
        totalUsers,
        totalListings,
      };
    });
  }

  /**
   * Get audit logs
   */
  getAuditLogs(page: number = 1, pageSize: number = 50): Effect.Effect<AuditLog[], Error> {
    return Effect.tryPromise({
      try: () =>
        this.prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      catch: (error) => new Error(`Failed to fetch audit logs: ${error}`),
    });
  }

  /**
   * Get all admin user emails
   */
  async getAdminEmails(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['SUPPORT', 'MODERATOR', 'MANAGER', 'SUPER_ADMIN'],
        },
        status: 'ACTIVE',
      },
      select: {
        email: true,
      },
    });

    return admins.map((admin) => admin.email);
  }

  /**
   * Get pending counts for admin notifications
   */
  async getPendingCounts(): Promise<{ pendingUsers: number; pendingListings: number }> {
    const [pendingUsers, pendingListings] = await Promise.all([
      this.prisma.user.count({
        where: { status: UserStatus.PENDING_APPROVAL },
      }),
      this.prisma.listing.count({
        where: { status: ListingStatus.PENDING_APPROVAL },
      }),
    ]);

    return { pendingUsers, pendingListings };
  }

  /**
   * Publish pending counts update to subscribed admins
   */
  async publishPendingCountsUpdate(): Promise<void> {
    const counts = await this.getPendingCounts();
    await this.pubSubService.publish(PubSubEvents.ADMIN_PENDING_COUNTS_CHANGED, counts);
  }
}
