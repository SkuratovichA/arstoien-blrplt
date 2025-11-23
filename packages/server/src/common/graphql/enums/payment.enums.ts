import { registerEnumType } from '@nestjs/graphql';
import { PaymentStatus, Currency } from '@prisma/client';

// Re-export Prisma enums
export { PaymentStatus, Currency };

// Define Payment Method (not in Prisma schema)
export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  GOPAY = 'GOPAY',
}

// Define Payment Status (custom enum for payment.entity.ts)
export enum PaymentStatusCustom {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

// Define Invoice Status (not in Prisma schema)
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

// Register enums for GraphQL
registerEnumType(PaymentStatus, {
  name: 'TransactionPaymentStatus',
  description: 'The status of a payment transaction (from Prisma)',
});

registerEnumType(PaymentStatusCustom, {
  name: 'PaymentStatus',
  description: 'The status of a payment',
});

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Payment method used',
});

registerEnumType(Currency, {
  name: 'Currency',
  description: 'Currency code',
});

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
  description: 'The status of an invoice',
});
