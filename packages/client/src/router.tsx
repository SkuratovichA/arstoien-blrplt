import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { useAuthStore } from './lib/auth-store';

export const router = createRouter({
  routeTree,
  context: {
    isAuthenticated: false,
    user: null,
  },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function useRouterContext() {
  const { user, isAuthenticated } = useAuthStore();

  return {
    isAuthenticated,
    user,
  };
}
