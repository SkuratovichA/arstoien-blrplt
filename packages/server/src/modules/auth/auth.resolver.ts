import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.dto';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { RegisterWithPasswordInput } from './dto/register-with-password.input';
import { SetPasswordInput } from './dto/set-password.input';
import { RegisterResponse } from './dto/register-response.dto';
import { SetPasswordWithTokenInput } from './dto/set-password-with-token.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '@config/app.config';
import { runEffect } from '@/common/effect';
import { BasicResponse } from '../user/dto/basic-response.dto';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { CurrentUser } from './decorators';
import { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  @Mutation(() => AuthResponse, { description: 'Login with email and password' })
  async login(
    @Args('input') input: LoginInput,
    @Context('req') req: Request
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.loginAsync(input.email, input.password);

    // Set tokens in httpOnly cookies
    if (req.res) {
      req.res.cookie('accessToken', authResponse.accessToken, this.appConfiguration.cookieOptions);
      req.res.cookie(
        'refreshToken',
        authResponse.refreshToken,
        this.appConfiguration.cookieOptions
      );
    }

    this.logger.log(`User logged in: ${authResponse.user.id}`);
    return authResponse;
  }

  @Mutation(() => AuthResponse, { description: 'Register new user account with password (legacy)' })
  async registerWithPassword(
    @Args('input') input: RegisterWithPasswordInput,
    @Context('req') req: Request
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.registerWithPasswordAsync(
      input.email,
      input.password,
      input.firstName,
      input.lastName
    );

    // Set tokens in httpOnly cookies
    if (req.res) {
      req.res.cookie('accessToken', authResponse.accessToken, this.appConfiguration.cookieOptions);
      req.res.cookie(
        'refreshToken',
        authResponse.refreshToken,
        this.appConfiguration.cookieOptions
      );
    }

    this.logger.log(`User registered with password: ${authResponse.user.id}`);
    return authResponse;
  }

  @Mutation(() => Boolean, { description: 'Logout user and clear authentication cookies' })
  public async logout(@Context('req') req: Request) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    req.res?.clearCookie('accessToken', this.appConfiguration.cookieOptions);
    req.res?.clearCookie('refreshToken', this.appConfiguration.cookieOptions);

    this.logger.log('User logged out successfully');
    return true;
  }

  @Mutation(() => String, {
    description: 'Refresh access token using refresh token from cookies',
    nullable: true,
  })
  async refresh(@Context('req') req: Request): Promise<string | null> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      this.logger.warn('No refresh token provided in cookies');

      // Clear cookies if no refresh token
      if (req.res) {
        req.res.clearCookie('accessToken', this.appConfiguration.cookieOptions);
        req.res.clearCookie('refreshToken', this.appConfiguration.cookieOptions);
      }

      return null;
    }

    const newAccessToken = await this.authService.reissueAccessToken(refreshToken);

    if (!newAccessToken) {
      this.logger.warn('Invalid refresh token, clearing cookies');

      // Clear cookies if refresh token is invalid
      if (req.res) {
        req.res.clearCookie('accessToken', this.appConfiguration.cookieOptions);
        req.res.clearCookie('refreshToken', this.appConfiguration.cookieOptions);
      }

      return null;
    }

    // Set new access token in cookie
    if (req.res) {
      req.res.cookie('accessToken', newAccessToken, this.appConfiguration.cookieOptions);
    }

    this.logger.log('Access token refreshed successfully');
    return newAccessToken;
  }

  @Mutation(() => RegisterResponse, {
    description:
      'User registration with personal details and optional company ICO. Admin approval required.',
  })
  async register(
    @Args('input') input: RegisterInput
  ): Promise<RegisterResponse> {
    return runEffect(
      this.authService.register(
        input.email,
        input.firstName,
        input.lastName,
        input.phone
      )
    );
  }

  @Mutation(() => AuthResponse, {
    description: 'Set password using verification token from email and return auth tokens',
  })
  async setPasswordWithToken(
    @Args('input') input: SetPasswordWithTokenInput,
    @Context('req') req: Request
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.setPasswordWithTokenAsync(
      input.token,
      input.password
    );

    // Set tokens in httpOnly cookies
    if (req.res) {
      req.res.cookie('accessToken', authResponse.accessToken, this.appConfiguration.cookieOptions);
      req.res.cookie(
        'refreshToken',
        authResponse.refreshToken,
        this.appConfiguration.cookieOptions
      );
    }

    this.logger.log(`Password set for user: ${authResponse.user.id}`);
    return authResponse;
  }

  @Mutation(() => AuthResponse, {
    description:
      'Set password for users in FRESHLY_CREATED_REQUIRES_PASSWORD status and return auth tokens',
  })
  async setPassword(@Args('input') input: SetPasswordInput): Promise<AuthResponse> {
    return this.authService.setPasswordAsync(input.userId, input.password);
  }

  @Mutation(() => Boolean, {
    description:
      'Request password reset email. Returns true even if email does not exist (security).',
  })
  async forgotPassword(@Args('input') input: ForgotPasswordInput): Promise<boolean> {
    this.logger.log(`Forgot password request for email: ${input.email}`);
    return this.authService.forgotPasswordAsync(input.email);
  }

  @Mutation(() => Boolean, {
    description: 'Reset password using token from email. Token valid for 30 minutes.',
  })
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<boolean> {
    this.logger.log('Reset password request');
    return this.authService.resetPasswordAsync(input.token, input.newPassword);
  }

  @Mutation(() => BasicResponse, {
    description: 'Verify email address using token from verification email',
  })
  async verifyEmail(@Args('token') token: string): Promise<BasicResponse> {
    this.logger.log(`Email verification requested with token`);

    try {
      // Find and validate the verification token
      const verificationToken = await this.prisma.verificationToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!verificationToken || verificationToken.type !== 'EMAIL_VERIFICATION') {
        this.logger.warn('Invalid email verification token');
        return {
          success: false,
          message: 'Invalid or expired verification token',
        };
      }

      // Check if token has expired
      const currentDate = new Date();
      if (verificationToken.expiresAt < currentDate) {
        this.logger.warn('Email verification token expired');
        return {
          success: false,
          message: 'Verification token has expired',
        };
      }

      // Update user's email verification status
      await this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerifiedAt: new Date(),
          // If user is pending approval and email is now verified, keep status as is
          // Admin still needs to approve the user
        },
      });

      // Delete the used token
      await this.prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      this.logger.log(`Email verified successfully for user: ${verificationToken.userId}`);
      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      this.logger.error('Email verification failed:', error);
      return {
        success: false,
        message: 'Email verification failed',
      };
    }
  }

  @Mutation(() => BasicResponse, {
    description: 'Resend email verification link to user',
  })
  @UseGuards(GqlAuthGuard)
  async resendVerificationEmail(@CurrentUser() user: User): Promise<BasicResponse> {
    this.logger.log(`Resend verification email requested for user: ${user.id}`);

    try {
      // Check if email is already verified
      if (user.emailVerifiedAt) {
        return {
          success: false,
          message: 'Email is already verified',
        };
      }

      // Delete any existing verification tokens for this user
      await this.prisma.verificationToken.deleteMany({
        where: {
          userId: user.id,
          type: 'EMAIL_VERIFICATION',
        },
      });

      // Generate new verification token
      const token = await this.authService.generateVerificationToken(user.id);
      this.logger.log(`Generated new verification token for user: ${user.id}`);

      // Send verification email
      await this.authService.sendVerificationEmail(user.email, token);
      this.logger.log(`Email service completed for user: ${user.id}`);

      this.logger.log(`Verification email resent to user: ${user.id}`);
      return {
        success: true,
        message: 'Verification email sent successfully',
      };
    } catch (error) {
      this.logger.error('Failed to resend verification email:', error);
      return {
        success: false,
        message: 'Failed to send verification email',
      };
    }
  }
}
