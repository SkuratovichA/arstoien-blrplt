import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';
import { AdminModule } from '../admin/admin.module';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('app.jwt.secret'),
        signOptions: {
          expiresIn: configService.get('app.jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    NotificationModule,
    RefreshTokenModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    GoogleStrategy,
    PermissionsGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtModule, PermissionsGuard, RolesGuard],
})
export class AuthModule {}
