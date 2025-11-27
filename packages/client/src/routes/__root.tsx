import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../lib/auth-store';
import type { AuthGuardContext } from '../lib/auth-guard';

export const Route = createRootRoute({
  beforeLoad: (): AuthGuardContext => {
    const { isAuthenticated, user } = useAuthStore.getState();
    return {
      isAuthenticated,
      user: user
        ? {
            id: user.id,
            email: user.email,
            emailVerifiedAt: user.emailVerifiedAt,
            createdAt: user.createdAt,
          }
        : null,
    };
  },
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
