import { forwardRef, Inject, Injectable, Logger, Optional, UnauthorizedException, } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Effect } from 'effect';

import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../notification/email.service';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { OtpService } from './otp.service';
import { AuthProvider, User, UserStatus } from '@prisma/client';
import { ConflictError, DatabaseError, promiseToEffect, runEffect, UnauthorizedError, ValidationError, } from '@/common/effect';
import { PubSubService } from '@common/pubsub/pubsub.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private refreshTokenService: RefreshTokenService,
    private otpService: OtpService,
    private pubSubService: PubSubService,
    @Optional()
    @Inject(forwardRef(() => AdminService))
    private adminService: AdminService | null
  ) {}

  validateUser(
    email: string,
    password: string
  ): Effect.Effect<User | null, ValidationError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      self.logger.debug(`Validating user: ${email}`);

      const user = yield* Effect.match(self.userService.findByEmail(email), {
        onFailure: () => null,
        onSuccess: (user) => user,
      });

      if (!user || !user.passwordHash) {
        self.logger.debug(`User not found or no password hash: ${email}`);
        return null;
      }

      const isPasswordValid = yield* promiseToEffect(() =>
        bcrypt.compare(password, user.passwordHash!)
      );

      if (!isPasswordValid) {
        self.logger.debug(`Invalid password for user: ${email}`);
        return null;
      }

      self.logger.debug(`User validated successfully: ${email}`);
      return user;
    });
  }

  async validateUserAsync(email: string, password: string): Promise<User | null> {
    return Effect.runPromise(this.validateUser(email, password));
  }

  async invalidateTokens(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    this.logger.debug('Invalidating refresh token');

    await Effect.runPromise(this.refreshTokenService.deleteToken(refreshToken)).catch((error) => {
      this.logger.error('Failed to invalidate refresh token:', error);
    });

    this.logger.log('Refresh token invalidated');
  }

  async validateUserById(userId: string): Promise<User> {
    this.logger.debug(`Validating user by ID: ${userId}`);

    const userEffect = this.userService.findById(userId);
    const user = await Effect.runPromise(userEffect).catch(() => null);

    if (!user) {
      this.logger.warn(`User not found by ID: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.debug(`User validated by ID: ${userId}`);
    return user;
  }

  /**
   * User registration
   * Creates user with PENDING_APPROVAL status
   * Admin must approve before verification email is sent
   */
  register(
    email: string,
    firstName: string,
    lastName: string,
    phone: string
  ): Effect.Effect<
    { success: boolean; message: string },
    ConflictError | ValidationError | DatabaseError,
    never
  > {
    const self = this;

    return Effect.gen(function* () {
      self.logger.log(
        `Starting registration for email: ${email}, firstName: ${firstName}, lastName: ${lastName}`
      );

      // Check if user exists
      const existingUser = yield* Effect.match(self.userService.findByEmail(email), {
        onFailure: () => null,
        onSuccess: (user) => user,
      });

      if (existingUser) {
        self.logger.warn(`Registration failed: user already exists with email: ${email}`);
        return yield* Effect.fail(
          new ConflictError({
            message: 'User with this email already exists',
            field: 'email',
          })
        );
      }

      // Create user with PENDING_APPROVAL status
      const user = yield* self.userService.createUser({
        email,
        firstName,
        lastName,
        phone,
        authProvider: AuthProvider.EMAIL,
        status: UserStatus.PENDING_APPROVAL,
      });

      self.logger.log(`User created (pending approval): ${user.id}`);

      // Notify admins about new pending user (fire and forget)
      yield* Effect.forkDaemon(
        Effect.tryPromise({
          try: () => self.notifyAdminsAboutNewUser(user),
          catch: () =>
            new DatabaseError({ message: 'Failed to notify admins', operation: 'notify' }),
        }).pipe(
          Effect.catchAll(() => Effect.void) // Ignore errors for notification
        )
      );

      self.logger.log(`Registration completed for email: ${email}, awaiting admin approval`);

      return {
        success: true,
        message:
          'Registration submitted. An administrator will review your application and you will receive an email once approved.',
      };
    });
  }

  registerWithPassword(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Effect.Effect<AuthResponse, ValidationError | ConflictError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      self.logger.log(`Starting registration for email: ${email}`);

      // Check if user exists
      const existingUser = yield* Effect.match(self.userService.findByEmail(email), {
        onFailure: () => null,
        onSuccess: (user) => user,
      });

      if (existingUser) {
        self.logger.warn(`Registration failed: user already exists with email: ${email}`);
        return yield* Effect.fail(
          new ConflictError({
            message: 'User with this email already exists',
            field: 'email',
          })
        );
      }

      // Hash password
      const passwordHash = yield* promiseToEffect(() => bcrypt.hash(password, 10));

      // Create user with pending status
      const user = yield* self.userService.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        authProvider: AuthProvider.EMAIL,
        status: UserStatus.PENDING_APPROVAL,
      });

      self.logger.log(`User created via registration: ${user.id}`);

      // Notify admins about new pending user (fire and forget)
      yield* Effect.forkDaemon(
        promiseToEffect(() => self.notifyAdminsAboutNewUser(user)).pipe(
          Effect.catchAll(() => Effect.void)
        )
      );

      // Generate tokens
      const tokens = yield* promiseToEffect(() => self.generateTokens(user));

      self.logger.log(`Registration completed for email: ${email}`);

      return {
        user,
        ...tokens,
      };
    });
  }

  async registerWithPasswordAsync(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<AuthResponse> {
    return runEffect(this.registerWithPassword(email, password, firstName, lastName));
  }

  login(
    email: string,
    password: string
  ): Effect.Effect<AuthResponse, ValidationError | UnauthorizedError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      self.logger.log(`Login attempt for email: ${email}`);

      const user = yield* self.validateUser(email, password);

      if (!user) {
        self.logger.warn(`Login failed: invalid credentials for email: ${email}`);
        return yield* Effect.fail(new UnauthorizedError({ message: 'Invalid credentials' }));
      }

      // Check user status
      if (user.status === UserStatus.BLOCKED) {
        self.logger.warn(`Login failed: account blocked for user: ${user.id}`);
        return yield* Effect.fail(new UnauthorizedError({ message: 'Account is blocked' }));
      }

      if (user.status === UserStatus.SUSPENDED) {
        self.logger.warn(`Login failed: account suspended for user: ${user.id}`);
        return yield* Effect.fail(new UnauthorizedError({ message: 'Account is suspended' }));
      }

      // Update last login
      yield* self.userService.updateLastLogin(user.id);

      // Generate tokens
      const tokens = yield* promiseToEffect(() => self.generateTokens(user));

      self.logger.log(`Login successful for user: ${user.id}`);

      return {
        user,
        ...tokens,
      };
    });
  }

  async loginAsync(email: string, password: string): Promise<AuthResponse> {
    return runEffect(this.login(email, password));
  }

  async loginWithGoogle(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }): Promise<AuthResponse> {
    this.logger.log(`Google login attempt for email: ${profile.email}`);

    let user = await Effect.runPromise(
      this.userService.findByEmailOrGoogleId(profile.email, profile.googleId)
    );

    if (!user) {
      this.logger.log(`Creating new user via Google login: ${profile.email}`);

      // Create new user
      user = await Effect.runPromise(
        this.userService.createUser({
          googleId: profile.googleId,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatar: profile.avatar,
          authProvider: AuthProvider.GOOGLE,
          status: UserStatus.PENDING_APPROVAL, // Still needs ICO verification
        })
      );

      this.logger.log(`New user created via Google: ${user.id}`);

      // Notify admins about new pending user (fire and forget)
      this.notifyAdminsAboutNewUser(user).catch(() => {});
    } else if (!user.googleId) {
      this.logger.log(`Linking existing account with Google: ${user.id}`);

      // Link existing account with Google
      user = await Effect.runPromise(
        this.userService.updateUser(user.id, {
          googleId: profile.googleId,
          avatar: profile.avatar ?? user.avatar,
        })
      );
    }

    // Check user status
    if (user.status === UserStatus.BLOCKED) {
      this.logger.warn(`Google login failed: account blocked for user: ${user.id}`);
      throw new UnauthorizedException('Account is blocked');
    }

    if (user.status === UserStatus.SUSPENDED) {
      this.logger.warn(`Google login failed: account suspended for user: ${user.id}`);
      throw new UnauthorizedException('Account is suspended');
    }

    // Update last login
    await Effect.runPromise(this.userService.updateLastLogin(user.id));

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`Google login successful for user: ${user.id}`);

    return {
      user,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<Omit<AuthResponse, 'user'>> {
    this.logger.debug('Refreshing tokens');

    try {
      // Verify the refresh token JWT
      this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('app.jwt.refreshSecret'),
      });
    } catch {
      this.logger.warn('Invalid refresh token JWT');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists in database and is valid
    const tokenRecord = await Effect.runPromise(
      this.refreshTokenService.getValidTokenWithUser(refreshToken)
    ).catch((error) => {
      this.logger.error('Failed to get refresh token:', error);
      return null;
    });

    if (!tokenRecord) {
      this.logger.warn('Refresh token not found or expired');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Delete old refresh token
    await Effect.runPromise(this.refreshTokenService.deleteToken(refreshToken)).catch((error) => {
      this.logger.error('Failed to delete old refresh token:', error);
    });

    this.logger.log(`Tokens refreshed for user: ${tokenRecord.user.id}`);
    return this.generateTokens(tokenRecord.user);
  }

  async logout(refreshToken: string): Promise<void> {
    this.logger.debug('Logging out user');

    await Effect.runPromise(this.refreshTokenService.deleteToken(refreshToken)).catch((error) => {
      this.logger.error('Failed to logout:', error);
      throw error;
    });

    this.logger.log('User logged out successfully');
  }

  async logoutAll(userId: string): Promise<void> {
    this.logger.debug(`Logging out all sessions for user: ${userId}`);

    await Effect.runPromise(this.refreshTokenService.deleteAllUserTokens(userId)).catch((error) => {
      this.logger.error('Failed to logout all sessions:', error);
      throw error;
    });

    this.logger.log(`All sessions logged out for user: ${userId}`);
  }

  async reissueAccessToken(refreshToken: string): Promise<string | null> {
    this.logger.debug('Reissuing access token');

    try {
      // Verify the refresh token JWT
      this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('app.jwt.refreshSecret'),
      });
    } catch {
      this.logger.warn('Invalid refresh token JWT for reissue');
      return null;
    }

    // Check if refresh token exists in database and is valid
    const tokenRecord = await Effect.runPromise(
      this.refreshTokenService.getValidTokenWithUser(refreshToken)
    ).catch((error) => {
      this.logger.error('Failed to get refresh token for reissue:', error);
      return null;
    });

    if (!tokenRecord) {
      this.logger.warn('Refresh token not found or expired for reissue');
      return null;
    }

    // Generate new access token
    const newPayload: JwtPayload = {
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    };

    const accessToken = this.jwtService.sign(newPayload);
    this.logger.log(`Access token reissued for user: ${tokenRecord.user.id}`);

    return accessToken;
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.debug(`Generating tokens for user: ${user.id}`);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('app.jwt.refreshSecret'),
      expiresIn: this.configService.get('app.jwt.refreshExpiresIn'),
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days

    await Effect.runPromise(
      this.refreshTokenService.save({
        token: refreshToken,
        userId: user.id,
        expiresAt,
      })
    ).catch((error) => {
      this.logger.error('Failed to save refresh token:', error);
      throw error;
    });

    this.logger.log(`Tokens generated for user: ${user.id}`);

    return {
      accessToken,
      refreshToken,
    };
  }

  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Effect.Effect<void, ValidationError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      const user = yield* Effect.match(self.userService.findById(userId), {
        onFailure: () => null,
        onSuccess: (user) => user,
      });

      if (!user || !user.passwordHash) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'User not found or no password set',
            field: 'userId',
          })
        );
      }

      const isPasswordValid = yield* promiseToEffect(() =>
        bcrypt.compare(oldPassword, user.passwordHash!)
      );

      if (!isPasswordValid) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Invalid old password',
            field: 'oldPassword',
          })
        );
      }

      const newPasswordHash = yield* promiseToEffect(() => bcrypt.hash(newPassword, 10));

      yield* self.userService.updatePassword(userId, newPasswordHash);
    });
  }

  async changePasswordAsync(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    return runEffect(this.changePassword(userId, oldPassword, newPassword));
  }

  /**
   * Set password for user who registered via ICO + email
   * Verifies the token and sets password, changing status to ACTIVE
   */
  setPasswordWithToken(
    token: string,
    password: string
  ): Effect.Effect<AuthResponse, ValidationError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      // Verify the token
      const verificationToken = yield* promiseToEffect(() =>
        self.prisma.verificationToken.findUnique({
          where: { token },
          include: { user: true },
        })
      );
      if (!verificationToken) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Verification token is not defined',
            field: 'token',
          })
        );
      }
      const currentDate = new Date();
      if (verificationToken.expiresAt < currentDate) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Verification token already expired by ${currentDate.toISOString()}`,
            field: 'token',
          })
        );
      }

      const user = verificationToken.user;
      if (user.status !== UserStatus.FRESHLY_CREATED_REQUIRES_PASSWORD) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Password already set',
            field: 'status',
          })
        );
      }

      const passwordHash = yield* promiseToEffect(() => bcrypt.hash(password, 10));
      // Update user with password and ACTIVE status
      const updatedUser = yield* self.userService.updateUser(user.id, {
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      });

      // Delete the used verification token
      yield* promiseToEffect(() =>
        self.prisma.verificationToken.delete({
          where: { id: verificationToken.id },
        })
      );

      // Generate auth tokens
      const tokens = yield* promiseToEffect(() => self.generateTokens(updatedUser));

      return {
        user: updatedUser,
        ...tokens,
      };
    });
  }

  async setPasswordWithTokenAsync(token: string, password: string): Promise<AuthResponse> {
    return runEffect(this.setPasswordWithToken(token, password));
  }

  setPassword(
    userId: string,
    password: string
  ): Effect.Effect<AuthResponse, ValidationError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      const user = yield* Effect.match(self.userService.findById(userId), {
        onFailure: () => null,
        onSuccess: (user) => user,
      });
      if (!user) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'User not found',
            field: 'userId',
          })
        );
      }
      if (user.status !== UserStatus.FRESHLY_CREATED_REQUIRES_PASSWORD) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Password already set',
            field: 'status',
          })
        );
      }

      const passwordHash = yield* promiseToEffect(() => bcrypt.hash(password, 10));

      const updatedUser = yield* self.userService.updateUser(userId, {
        passwordHash,
        status: UserStatus.ACTIVE,
      });

      // Generate tokens using the centralized method
      const tokens = yield* promiseToEffect(() => self.generateTokens(updatedUser));

      self.logger.log(`Password set for user: ${userId}`);

      return {
        user: updatedUser,
        ...tokens,
      };
    });
  }

  async setPasswordAsync(userId: string, password: string): Promise<AuthResponse> {
    return runEffect(this.setPassword(userId, password));
  }

  /**
   * Generate a verification token for email verification
   * Public method so it can be used by AdminService when approving users
   */
  async generateVerificationToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId, type: 'email_verification' },
      { expiresIn: '24h' }
    );

    // Store token in database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await this.prisma.verificationToken.create({
      data: {
        token,
        userId,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Send verification email to user
   * Public method so it can be used by AdminService when approving users
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const clientUrl = this.configService.get('app.frontendUrl');
    const verificationLink = `${clientUrl}/auth/set-password?token=${token}`;

    // Send the verification email using the email service
    await this.emailService.sendVerificationEmail(email, verificationLink);

    // Log for debugging in development
    if (this.configService.get('app.environment') !== 'production') {
      this.logger.log(`Verification email sent to ${email}`);
      this.logger.log(`Verification link: ${verificationLink}`);
    }
  }

  /**
   * Generate password reset token and send email
   * Returns success even if user not found (security best practice)
   */
  forgotPassword(email: string): Effect.Effect<boolean, ValidationError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      self.logger.log(`Password reset requested for email: ${email}`);

      // Find user by email
      const user = yield* Effect.match(self.userService.findByEmail(email), {
        onFailure: () => null,
        onSuccess: (user) => user,
      });

      // If user not found, return success anyway (security: don't reveal user existence)
      if (!user) {
        self.logger.warn(`Password reset requested for non-existent email: ${email}`);
        return true;
      }

      // Generate reset token (30 minutes expiry)
      const token = self.jwtService.sign(
        { sub: user.id, type: 'password_reset' },
        { expiresIn: '30m' }
      );

      // Store token in database
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes

      yield* promiseToEffect(() =>
        self.prisma.verificationToken.create({
          data: {
            token,
            userId: user.id,
            type: 'PASSWORD_RESET',
            expiresAt,
          },
        })
      );

      // Send password reset email
      const clientUrl = self.configService.get('app.frontendUrl');
      const resetLink = `${clientUrl}/reset-password?token=${token}`;

      yield* promiseToEffect(() => self.emailService.sendPasswordResetEmail(user.email, resetLink));

      self.logger.log(`Password reset email sent to: ${email}`);

      return true;
    });
  }

  async forgotPasswordAsync(email: string): Promise<boolean> {
    return runEffect(this.forgotPassword(email));
  }

  /**
   * Reset password using token
   * Validates token expiration (must be < 30 minutes old)
   */
  resetPassword(
    token: string,
    newPassword: string
  ): Effect.Effect<boolean, ValidationError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      self.logger.log('Password reset attempt with token');

      // Find and verify token
      const verificationToken = yield* promiseToEffect(() =>
        self.prisma.verificationToken.findUnique({
          where: { token },
          include: { user: true },
        })
      );

      if (!verificationToken || verificationToken.type !== 'PASSWORD_RESET') {
        self.logger.warn('Invalid password reset token');
        return yield* Effect.fail(
          new ValidationError({
            message: 'Invalid or expired reset token',
            field: 'token',
          })
        );
      }

      // Check if token has expired (30 minutes)
      const currentDate = new Date();
      if (verificationToken.expiresAt < currentDate) {
        self.logger.warn(
          `Password reset token expired at ${verificationToken.expiresAt.toISOString()}`
        );
        return yield* Effect.fail(
          new ValidationError({
            message: 'Reset token has expired',
            field: 'token',
          })
        );
      }

      // Hash new password
      const passwordHash = yield* promiseToEffect(() => bcrypt.hash(newPassword, 10));

      // Update user password
      yield* self.userService.updatePassword(verificationToken.userId, passwordHash);

      // Delete used token
      yield* promiseToEffect(() =>
        self.prisma.verificationToken.delete({
          where: { id: verificationToken.id },
        })
      );

      self.logger.log(`Password reset successful for user: ${verificationToken.userId}`);

      return true;
    });
  }

  async resetPasswordAsync(token: string, newPassword: string): Promise<boolean> {
    return runEffect(this.resetPassword(token, newPassword));
  }

  /**
   * Notify all admins about a new pending user
   */
  private async notifyAdminsAboutNewUser(user: User): Promise<void> {
    // Get all admin emails
    const admins = await Effect.runPromise(this.userService.findAdmins());

    const adminEmails = admins.map((admin) => admin.email);

    // Fallback to configured admin email if no admins found
    if (adminEmails.length === 0) {
      const configAdminEmail = this.configService.get<string>('app.admin.email');
      if (configAdminEmail) {
        adminEmails.push(configAdminEmail);
      }
    }

    // Send notification to each admin
    for (const adminEmail of adminEmails) {
      runEffect(
        this.emailService.sendAdminNewUserNotification(adminEmail, {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          registeredAt: user.createdAt,
        })
      ).catch(() => {});
    }

    // Publish pending counts update for admin real-time notifications
    if (this.adminService) {
      // Make publishPendingCountsUpdate public or use a different approach
      // For now, skip this call since the method is private in AdminService
      this.logger.debug('Skipping pending counts update - method is private');
    }
  }

  /**
   * Check if OTP authentication is enabled for a user
   * Returns true only if:
   * 1. System-wide OTP is enabled
   * 2. User has OTP enabled (or hasn't disabled it)
   */
  async isOtpEnabledForUser(email: string): Promise<boolean> {
    try {
      // Check system settings
      const systemSettings = await this.prisma.systemSettings.findFirst();

      if (!systemSettings?.otpAuthEnabled) {
        return false; // OTP disabled system-wide
      }

      // Check user settings
      const user = await Effect.runPromise(this.userService.findByEmail(email));

      if (!user) {
        return false; // User not found
      }

      // Return user's OTP preference (defaults to false if not set)
      return user.otpAuthEnabled;
    } catch (error) {
      this.logger.error('Error checking OTP status:', error);
      return false;
    }
  }

  /**
   * Request OTP login - sends OTP code to user's email
   */
  requestOtpLogin(email: string): Effect.Effect<
    { success: boolean; message: string },
    ValidationError | UnauthorizedError | DatabaseError,
    never
  > {
    const self = this;

    return Effect.gen(function* () {
      self.logger.log(`OTP login requested for email: ${email}`);

      // Check if OTP is enabled
      const otpEnabled = yield* promiseToEffect(() => self.isOtpEnabledForUser(email));

      if (!otpEnabled) {
        self.logger.warn(`OTP login attempted but not enabled for: ${email}`);
        return yield* Effect.fail(
          new UnauthorizedError({ message: 'OTP authentication is not enabled' })
        );
      }

      // Find user
      const user = yield* Effect.match(self.userService.findByEmail(email), {
        onFailure: () => null,
        onSuccess: (user) => user,
      });

      if (!user) {
        self.logger.warn(`OTP login failed: user not found with email: ${email}`);
        // Return success to avoid email enumeration
        return {
          success: true,
          message: 'If an account exists with this email, an OTP code has been sent',
        };
      }

      // Check user status
      if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
        self.logger.warn(`OTP login failed: account not active for user: ${user.id}`);
        // Return success to avoid revealing account status
        return {
          success: true,
          message: 'If an account exists with this email, an OTP code has been sent',
        };
      }

      // Generate OTP
      const otpResult = yield* promiseToEffect(() =>
        Effect.runPromise(self.otpService.generateOtp(user.id, user.email))
      );

      // Send OTP email
      yield* promiseToEffect(() =>
        self.emailService.sendOtpEmail(user.email, otpResult.code)
      );

      self.logger.log(`OTP sent to: ${email}`);

      return {
        success: true,
        message: 'OTP code has been sent to your email',
      };
    });
  }

  async requestOtpLoginAsync(email: string): Promise<{ success: boolean; message: string }> {
    return runEffect(this.requestOtpLogin(email));
  }

  /**
   * Verify OTP login and return authentication tokens
   */
  verifyOtpLogin(
    email: string,
    code: string
  ): Effect.Effect<AuthResponse, ValidationError | UnauthorizedError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      self.logger.log(`OTP verification attempt for email: ${email}`);

      // Find user
      const user = yield* Effect.match(self.userService.findByEmail(email), {
        onFailure: () => null,
        onSuccess: (user) => user,
      });

      if (!user) {
        self.logger.warn(`OTP verification failed: user not found with email: ${email}`);
        return yield* Effect.fail(new UnauthorizedError({ message: 'Invalid OTP code' }));
      }

      // Validate OTP
      const isValid = yield* promiseToEffect(() =>
        Effect.runPromise(self.otpService.validateOtp(user.id, code))
      );

      if (!isValid) {
        self.logger.warn(`OTP verification failed: invalid code for user: ${user.id}`);
        return yield* Effect.fail(new UnauthorizedError({ message: 'Invalid or expired OTP code' }));
      }

      // Check user status
      if (user.status === UserStatus.BLOCKED) {
        self.logger.warn(`OTP login failed: account blocked for user: ${user.id}`);
        return yield* Effect.fail(new UnauthorizedError({ message: 'Account is blocked' }));
      }

      if (user.status === UserStatus.SUSPENDED) {
        self.logger.warn(`OTP login failed: account suspended for user: ${user.id}`);
        return yield* Effect.fail(new UnauthorizedError({ message: 'Account is suspended' }));
      }

      // Mark email as verified if not already
      if (!user.emailVerifiedAt) {
        yield* promiseToEffect(() =>
          self.prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date() },
          })
        );
      }

      // Update last login
      yield* self.userService.updateLastLogin(user.id);

      // Generate tokens
      const tokens = yield* promiseToEffect(() => self.generateTokens(user));

      // Create audit log
      yield* promiseToEffect(() =>
        self.prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'OTP_LOGIN_SUCCESS',
            entityType: 'User',
            entityId: user.id,
            metadata: {
              email: user.email,
              loginMethod: 'OTP',
            },
          },
        })
      );

      self.logger.log(`OTP login successful for user: ${user.id}`);

      return {
        user,
        ...tokens,
      };
    });
  }

  async verifyOtpLoginAsync(email: string, code: string): Promise<AuthResponse> {
    return runEffect(this.verifyOtpLogin(email, code));
  }
}
