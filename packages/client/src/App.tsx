import { RouterProvider } from '@tanstack/react-router';
import { router, useRouterContext } from './router';
import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { CURRENT_USER_QUERY } from './graphql/auth.graphql';
import { useAuthStore } from './lib/auth-store';

export function App() {
  const context = useRouterContext();
  const { setUser } = useAuthStore();

  // Always fetch current user on app load to validate tokens
  // This ensures auth relies on server validation, not just client state
  const { data, error } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: 'network-only', // Always fetch fresh data
    errorPolicy: 'ignore', // Don't throw on error
  });

  useEffect(() => {
    if (data?.currentUser) {
      // Update auth store with fresh user data from server
      setUser({
        id: data.currentUser.id,
        email: data.currentUser.email,
        firstName: data.currentUser.firstName,
        lastName: data.currentUser.lastName,
        phone: data.currentUser.phone,
        emailVerifiedAt: data.currentUser.emailVerifiedAt,
        createdAt: data.currentUser.createdAt,
      });
    } else if (error) {
      // If fetching current user fails (e.g., token invalid/expired), clear auth
      // This ensures deleting tokens actually logs the user out
      setUser(null);
    }
  }, [data, error, setUser]);

  return <RouterProvider router={router} context={context} />;
}
