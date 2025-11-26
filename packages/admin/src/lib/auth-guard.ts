import { redirect } from '@tanstack/react-router';
import { useAuthStore, UserRole } from './auth-store';

export function requireAuth() {
  const { isAuthenticated, user } = useAuthStore.getState();

  if (!isAuthenticated) {
    throw redirect({
      to: '/login',
      search: {
        redirect: window.location.pathname,
      },
    });
  }

  // Check if user has admin access (SUPER_ADMIN, ADMIN, or MODERATOR)
  if (user && !hasAdminAccess(user.role)) {
    throw redirect({
      to: '/login',
    });
  }

  return { user };
}

export function requireAdminRole() {
  const { isAuthenticated, user } = useAuthStore.getState();

  if (!isAuthenticated) {
    throw redirect({
      to: '/login',
    });
  }

  // Check if user has admin role
  if (user && user.role !== UserRole.ADMIN) {
    throw redirect({
      to: '/',
    });
  }

  return { user };
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export function isModerator(role: UserRole): boolean {
  return role === UserRole.MODERATOR;
}

export function hasAdminAccess(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.MODERATOR;
}
