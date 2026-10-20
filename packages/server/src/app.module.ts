import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CommonModule } from './common/common.module.js';
import { formatGraphqlError } from './common/graphql/format-error.js';
import { PubSubModule } from './common/pubsub/pubsub.module.js';
import { DateScalar } from './common/scalars/date.scalar.js';
import { AppConfig, appConfig } from './config/app.config.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { SchedulerModule } from './modules/scheduler/scheduler.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { UserModule } from './modules/user/user.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';

// Import to ensure all GraphQL enums are registered
import './common/graphql/index.js';

const graphqlContextLogger = new Logger('GraphQLContext');

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
          graphiql: appConfig.graphql.graphiql,
          // Apollo Server 5 answers a malformed variable with HTTP 400; the clients of this API read errors from a 200 body
          status400ForVariableCoercionErrors: false,
          context: async ({ req, res, connection }: GraphQLContext) => {
            // For subscriptions, connection.context contains user info from onConnect
            if (connection) {
              return { req: connection.context.req, res, user: connection.context.user };
            }

            // For regular queries/mutations - try to authenticate from JWT token
            const authHeader = req?.headers?.authorization;
            if (authHeader?.startsWith('Bearer ')) {
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
                    graphqlContextLogger.debug(`Authenticated user: ${user.id} (${user.email})`);
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
          formatError: formatGraphqlError,
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
    HealthModule,
  ],
  providers: [DateScalar],
})
export class AppModule {}
