import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  Body,
  Logger,
  Query,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';

/**
 * AuthController - REST endpoints for authentication
 *
 * NOTE: Most authentication functionality has been moved to AuthResolver (GraphQL).
 * This controller only handles OAuth flows which require REST due to browser redirects.
 *
 * OAuth Endpoints (Must remain REST):
 * - GET /auth/google - Initiates Google OAuth flow
 * - GET /auth/google/callback - Handles OAuth callback and redirects to frontend
 *
 * All other auth operations should use GraphQL mutations in AuthResolver:
 * - login, register, logout, refresh, setPasswordWithToken, registerWithIco
 *
 * @deprecated for non-OAuth operations - use AuthResolver instead
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Query('redirect_uri') _redirectUri?: string) {
    // Initiates the Google OAuth flow
    // The redirect_uri is handled by the GoogleAuthGuard via state parameter
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const userPayload = req.user as {
      user: User;
      accessToken: string;
      refreshToken: string;
      redirectUri?: string;
    };

    if (!userPayload) {
      throw new ForbiddenException('No user from Google');
    }

    const { accessToken, refreshToken, redirectUri } = userPayload;
    const cookieOptions = this.configService.get('app.cookieOptions');

    // Set tokens in httpOnly cookies
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Determine redirect URL
    const defaultUrl = this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:3000';
    let finalRedirectUrl = defaultUrl;

    if (redirectUri) {
      // Validate redirect_uri against whitelist
      const allowedUris = this.configService.get<string[]>('app.allowedRedirectUris');
      if (allowedUris && allowedUris.includes(redirectUri)) {
        finalRedirectUrl = redirectUri;
      } else {
        this.logger.warn(`Redirect URI not in whitelist: ${redirectUri}`);
      }
    }

    // Redirect to frontend
    res.redirect(finalRedirectUrl);
  }

  /**
   * @deprecated Use AuthResolver.refresh mutation instead (GraphQL)
   */
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new ForbiddenException('No refresh token provided');
    }

    try {
      const newAccessToken = await this.authService.reissueAccessToken(refreshToken);

      if (!newAccessToken) {
        const cookieOptions = this.configService.get('app.cookieOptions');
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
        throw new ForbiddenException('Invalid refresh token');
      }

      const cookieOptions = this.configService.get('app.cookieOptions');
      res.cookie('accessToken', newAccessToken, cookieOptions);

      return res.send({ accessToken: newAccessToken });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to refresh token: ${errorMessage}`);
      const cookieOptions = this.configService.get('app.cookieOptions');
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  /**
   * @deprecated Use AuthResolver.logout mutation instead (GraphQL)
   */
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    const cookieOptions = this.configService.get('app.cookieOptions');
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.send({ message: 'Logged out successfully' });
  }

  /**
   * @deprecated Use AuthResolver.setPasswordWithToken mutation instead (GraphQL)
   */
  @Post('set-password')
  async setPasswordWithToken(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { token: string; password: string }
  ) {
    try {
      const authResponse = await this.authService.setPasswordWithTokenAsync(
        body.token,
        body.password
      );

      const cookieOptions = this.configService.get('app.cookieOptions');
      res.cookie('accessToken', authResponse.accessToken, cookieOptions);
      res.cookie('refreshToken', authResponse.refreshToken, cookieOptions);

      return res.send({
        success: true,
        user: authResponse.user,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to set password: ${errorMessage}`);
      throw new ForbiddenException(errorMessage ?? 'Failed to set password');
    }
  }
}
