import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      clientID: configService.get('app.google.clientId') ?? 'placeholder-client-id',
      clientSecret: configService.get('app.google.clientSecret') ?? 'placeholder-client-secret',
      callbackURL: configService.get('app.google.callbackUrl'),
      scope: ['email', 'profile'],
      passReqToCallback: true,
      state: true,
    });
  }

  async validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    // Validate that we have an email
    if (!emails || emails.length === 0 || !emails[0]?.value) {
      return done(
        new UnauthorizedException('No email associated with this Google account'),
        undefined
      );
    }

    try {
      // Call AuthService to handle user creation/login
      const authResponse = await this.authService.loginWithGoogle({
        googleId: id,
        email: emails[0].value,
        firstName: name?.givenName ?? '',
        lastName: name?.familyName ?? '',
        avatar: photos?.[0]?.value,
      });

      // Extract redirect_uri from query parameter (passed via state)
      const queryRedirectUri = req.query?.redirect_uri;
      const redirectUri = typeof queryRedirectUri === 'string' ? queryRedirectUri : undefined;

      // Pass the full auth response (user + tokens) + redirect_uri to Passport
      done(null, { ...authResponse, redirectUri });
    } catch (error) {
      done(error, undefined);
    }
  }
}
