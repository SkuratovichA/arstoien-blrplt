import { registerEnumType } from '@nestjs/graphql';

/**
 * Bidding event types for subscriptions
 */
export enum BiddingEventType {
  BID_PLACED = 'bidPlaced',
  AUCTION_ENDED = 'auctionEnded',
}

// Register enum for GraphQL
registerEnumType(BiddingEventType, {
  name: 'BiddingEventType',
  description: 'Types of bidding events that can be subscribed to',
});
