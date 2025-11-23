import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

// Config
import { appConfig, AppConfig } from '@config/app.config';

interface GraphQLContext {
  req: Request & {
    user?: unknown;
  };
  res: Response;
  connection?: {
    context: {
      req: unknown;
      user: unknown;
    };
  };
}

// Modules
import { PrismaModule } from '@prisma/prisma.module';
import { PrismaService } from '@prisma/prisma.service';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { AdminModule } from '@modules/admin/admin.module';
import { SchedulerModule } from '@modules/scheduler/scheduler.module';
import { SettingsModule } from '@modules/settings/settings.module';

// Common
import { PubSubModule } from '@common/pubsub/pubsub.module';
import { CommonModule } from '@common/common.module';
import { DateScalar } from '@common/scalars/date.scalar';

// Import to ensure all GraphQL enums are registered
import '@/common/graphql';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule, PrismaModule, AuthModule],
      inject: [ConfigService, JwtService, PrismaService],
      useFactory: (
        configService: ConfigService,
        jwtService: JwtService,
        prismaService: PrismaService
      ) => {
        const appConfig = configService.get<AppConfig>('app');

        if (!appConfig) {
          throw new Error('App configuration not found');
        }

        return {
          autoSchemaFile: true,
          sortSchema: true,
          installSubscriptionHandlers: true,
          autoTransformHttpErrors: true,
          introspection: appConfig.graphql.introspection,
          playground: appConfig.graphql.playground,
          cors: appConfig.cors,
          uploads: {
            maxFileSize: 10000000, // 10MB
            maxFiles: 10,
          },
          context: async ({ req, res, connection }: GraphQLContext) => {
            // For subscriptions, connection.context contains user info from onConnect
            if (connection) {
              return { req: connection.context.req, res, user: connection.context.user };
            }

            // For regular queries/mutations - try to authenticate from JWT token
            const authHeader = req?.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
              const token = authHeader.substring(7);

              try {
                // Verify and decode JWT token
                const payload = await jwtService.verifyAsync(token, {
                  secret: appConfig.jwt.secret,
                });

                // Fetch user from database
                if (payload?.sub) {
                  const user = await prismaService.user.findUnique({
                    where: { id: payload.sub },
                  });

                  if (user) {
                    // Attach user to request
                    req.user = user;
                    console.log(`[GraphQL Context] Authenticated user: ${user.id} (${user.email})`);
                  }
                }
              } catch (error) {
                // Token is invalid or expired - silently ignore and proceed as unauthenticated
                console.error(
                  `[GraphQL Context] Failed to authenticate token: ${(error as Error).message}`
                );
              }
            }

            return { req, res };
          },
          subscriptions: {
            'graphql-ws': {
              onConnect: (context) => {
                const { connectionParams } = context;

                // Extract authToken from connection params
                const authToken = connectionParams?.authToken;

                if (authToken) {
                  // Return the token in a format that can be used by guards
                  // The JWT strategy will extract and validate this token
                  return {
                    req: {
                      headers: {
                        authorization: `Bearer ${authToken}`,
                      },
                    },
                    user: null, // Will be populated by JWT strategy
                  };
                }

                // No auth token provided - return empty context
                return { req: { headers: {} }, user: null };
              },
            },
          },
          formatError: (error) => ({
            message: error.message,
            code: error.extensions?.code ?? 'INTERNAL_SERVER_ERROR',
            path: error.path,
          }),
        };
      },
    }),

    // Core modules
    PrismaModule,
    PubSubModule,
    CommonModule,

    // Feature modules
    AuthModule,
    UserModule,
    NotificationModule,
    AdminModule,
    SchedulerModule,
    SettingsModule,
  ],
  providers: [DateScalar],
})
export class AppModule {}
