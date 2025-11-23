import { redirect } from '@tanstack/react-router';

export interface AuthGuardContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    isTwoFactorEnabled: boolean;
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
    });
  }
};

export const requireEmailVerified = (context: AuthGuardContext) => {
  requireAuth(context);

  if (context.user && !context.user.isEmailVerified) {
    throw redirect({
      to: '/verify-email',
    });
  }
};
