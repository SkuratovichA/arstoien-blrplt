import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { ListingStatus } from '@prisma/client';
import { PubSubService } from '@/common/pubsub/pubsub.service';
import { EmailService } from '@modules/notification/email.service';
import { runEffect } from '@/common/effect';

/**
 * SchedulerService - Background jobs for auction lifecycle management
 *
 * Handles:
 * - Scheduled listing activation (SCHEDULED → ACTIVE)
 * - Auction ending (ACTIVE → ENDED)
 * - Cleanup tasks
 */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private pubSub: PubSubService,
    private emailService: EmailService
  ) {}

  onModuleInit() {
    this.logger.log('SchedulerService initialized - Background jobs started');
  }

  /**
   * Activate scheduled listings
   * Runs every minute to check for listings that should start
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'activate-scheduled-listings',
  })
  async activateScheduledListings(): Promise<void> {
    // Prevent concurrent execution
    if (this.isRunning) {
      this.logger.debug('Previous activation job still running, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();

      // Find all scheduled listings whose start time has arrived
      const scheduledListings = await this.prisma.listing.findMany({
        where: {
          status: ListingStatus.SCHEDULED,
          startsAt: {
            lte: now,
          },
        },
        include: {
          seller: true,
          company: true,
          watchlist: {
            include: {
              user: true,
            },
          },
        },
      });

      if (scheduledListings.length === 0) {
        this.logger.debug('No scheduled listings to activate');
        return;
      }

      this.logger.log(`Activating ${scheduledListings.length} scheduled listing(s)`);

      // Activate each listing
      for (const listing of scheduledListings) {
        try {
          // Update status to ACTIVE
          const updated = await this.prisma.listing.update({
            where: { id: listing.id },
            data: {
              status: ListingStatus.ACTIVE,
            },
            include: {
              seller: true,
              company: true,
              images: {
                orderBy: { order: 'asc' },
              },
              category: true,
            },
          });

          this.logger.log(`✅ Activated listing: ${listing.title} (${listing.id})`);

          // Publish AUCTION_UPDATED event to notify subscribers
          this.pubSub.publish('AUCTION_UPDATED', {
            auctionUpdated: {
              id: updated.id,
              status: updated.status,
              startsAt: updated.startsAt,
              endsAt: updated.endsAt,
              currentPrice: updated.currentPrice,
              bidCount: updated.bidCount,
            },
          });

          // Notify watchers that the auction has started
          if (listing.watchlist.length > 0) {
            this.logger.log(
              `Notifying ${listing.watchlist.length} watcher(s) about listing activation`
            );

            for (const watchlistEntry of listing.watchlist) {
              // Send email notification (fire and forget)
              runEffect(
                this.emailService.sendPlainEmail(
                  watchlistEntry.user.email,
                  'Aukce byla zahájena',
                  `Dobrý den,\n\nAukce "${listing.title}", kterou sledujete, právě začala!\n\nAktuální cena: ${listing.currentPrice} ${listing.currency}\nKonec aukce: ${listing.endsAt.toLocaleString('cs-CZ')}\n\nMůžete začít nabízet na: [URL aukce]\n\nDěkujeme.`
                )
              ).catch(() => {});

              // Create notification record
              await this.prisma.notification.create({
                data: {
                  userId: watchlistEntry.userId,
                  type: 'LISTING_STARTED',
                  title: 'Aukce zahájena',
                  message: `Aukce "${listing.title}" právě začala!`,
                  data: {
                    listingId: listing.id,
                    listingTitle: listing.title,
                  },
                },
              });
            }
          }
        } catch (error) {
          this.logger.error(
            `Failed to activate listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error instanceof Error ? error.stack : undefined
          );
          // Continue with other listings even if one fails
        }
      }

      this.logger.log(
        `✅ Listing activation completed: ${scheduledListings.length} listing(s) processed`
      );
    } catch (error) {
      this.logger.error(
        `Error in activateScheduledListings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * End active auctions
   * Runs every minute to check for auctions that should end
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'end-active-auctions',
  })
  async endActiveAuctions(): Promise<void> {
    try {
      const now = new Date();

      // Find all active listings whose end time has passed
      const endedListings = await this.prisma.listing.findMany({
        where: {
          status: ListingStatus.ACTIVE,
          endsAt: {
            lte: now,
          },
        },
        include: {
          bids: {
            where: { isWinning: true },
            orderBy: { amount: 'desc' },
            take: 1,
            include: {
              bidder: true,
            },
          },
          seller: true,
        },
      });

      if (endedListings.length === 0) {
        this.logger.debug('No active auctions to end');
        return;
      }

      this.logger.log(`Ending ${endedListings.length} active auction(s)`);

      for (const listing of endedListings) {
        try {
          const winningBid = listing.bids[0];
          let newStatus: ListingStatus;
          let winnerId: string | null = null;

          if (!winningBid) {
            // No bids - mark as ended with no bids
            newStatus = ListingStatus.ENDED_NO_BIDS;
          } else if (listing.reservePrice && winningBid.amount.lt(listing.reservePrice)) {
            // Reserve price not met
            newStatus = ListingStatus.ENDED_NO_SALE;
          } else {
            // Auction ended with a winner
            newStatus = ListingStatus.ENDED;
            winnerId = winningBid.bidderId;
          }

          // Update listing status
          await this.prisma.listing.update({
            where: { id: listing.id },
            data: {
              status: newStatus,
              winnerId,
              winningBidId: winningBid?.id ?? null,
              soldAt: winnerId ? now : null,
            },
          });

          this.logger.log(
            `✅ Ended auction: ${listing.title} (${listing.id}) - Status: ${newStatus}`
          );

          // Publish AUCTION_UPDATED event
          this.pubSub.publish('AUCTION_UPDATED', {
            auctionUpdated: {
              id: listing.id,
              status: newStatus,
              winnerId,
              currentPrice: listing.currentPrice,
            },
          });

          // Send winner notification if there's a winner
          if (winnerId && winningBid) {
            this.logger.log(`Notifying winner ${winningBid.bidder.email} about auction win`);

            runEffect(
              this.emailService.sendPlainEmail(
                winningBid.bidder.email,
                'Vyhráli jste aukci!',
                `Dobrý den,\n\nGratulujeme! Vyhráli jste aukci "${listing.title}".\n\nVaše nabídka: ${winningBid.amount} ${listing.currency}\n\nProsím dokončete platbu do 7 dnů.\n\nDěkujeme.`
              )
            ).catch(() => {});

            await this.prisma.notification.create({
              data: {
                userId: winnerId,
                type: 'AUCTION_WON',
                title: 'Vyhráli jste aukci!',
                message: `Gratulujeme! Vyhráli jste aukci "${listing.title}" s nabídkou ${winningBid.amount} ${listing.currency}.`,
                data: {
                  listingId: listing.id,
                  listingTitle: listing.title,
                  winningBidAmount: winningBid.amount.toString(),
                  currency: listing.currency,
                },
              },
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to end auction ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error instanceof Error ? error.stack : undefined
          );
        }
      }

      this.logger.log(`✅ Auction ending completed: ${endedListings.length} auction(s) processed`);
    } catch (error) {
      this.logger.error(
        `Error in endActiveAuctions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  /**
   * Cleanup old notifications
   * Runs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'cleanup-old-notifications',
  })
  async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          readAt: {
            not: null,
          },
        },
      });

      this.logger.log(
        `✅ Cleaned up ${result.count} old read notification(s) (older than 30 days)`
      );
    } catch (error) {
      this.logger.error(
        `Error in cleanupOldNotifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }
}
