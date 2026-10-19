import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AdminModule } from '../admin/admin.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module.js';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './auth.controller.js';
import { AuthResolver } from './auth.resolver.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { OtpService } from './otp.service.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';

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
    OtpService,
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
