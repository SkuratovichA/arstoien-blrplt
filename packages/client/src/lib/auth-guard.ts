import { redirect } from '@tanstack/react-router';
import { isEmailVerified as checkEmailVerified } from './auth-store';

export interface AuthGuardContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    emailVerifiedAt?: string | null;
    isTwoFactorEnabled?: boolean;
    createdAt: string;
  } | null;
}

export const requireAuth = (context: AuthGuardContext) => {
  if (!context.isAuthenticated || !context.user) {
    throw redirect({
      to: '/login',
      search: {
        redirect: window.location.pathname,
      },
    });
  }
};

export const requireGuest = (context: AuthGuardContext) => {
  if (context.isAuthenticated && context.user) {
    throw redirect({
      to: '/dashboard',
      search: {},
    });
  }
};

export const requireEmailVerified = (context: AuthGuardContext) => {
  requireAuth(context);

  if (context.user && !checkEmailVerified(context.user)) {
    throw redirect({
      to: '/verify-email',
      search: { token: '' },
    });
  }
};
