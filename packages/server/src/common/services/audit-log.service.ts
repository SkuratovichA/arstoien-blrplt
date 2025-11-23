import { Injectable, Logger } from '@nestjs/common';
import { Effect } from 'effect';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { DatabaseError, promiseToEffect, ValidationError } from '@/common/effect';

interface CreateAuditLogParams {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  createAuditLog(
    params: CreateAuditLogParams
  ): Effect.Effect<void, DatabaseError | ValidationError, never> {
    return promiseToEffect(async () => {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue: (params.oldValue ?? null) as Prisma.InputJsonValue,
          newValue: (params.newValue ?? null) as Prisma.InputJsonValue,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: (params.metadata ?? null) as Prisma.InputJsonValue,
        },
      });

      this.logger.log(
        `Audit log created: ${params.action} on ${params.entityType}${params.entityId ? ` (${params.entityId})` : ''} by user ${params.userId ?? 'system'}`
      );
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  getEntityAuditLogs(
    entityType: string,
    entityId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Effect.Effect<unknown[], DatabaseError | ValidationError, never> {
    return promiseToEffect(() =>
      this.prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: options?.limit ?? 100,
        skip: options?.offset ?? 0,
      })
    );
  }
}
