import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@arstoien/shared-ui';
import { useAuthStore } from '@lib/auth-store';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { LOGOUT } from '@graphql/auth.graphql';
import toast from 'react-hot-toast';
import { env } from '@lib/env';
import { UserRole } from '@/gql/graphql';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const { user, logout } = useAuthStore();
  const [logoutMutation] = useMutation(LOGOUT);

  const handleLogout = async () => {
    try {
      await logoutMutation();
      logout();
      await apolloClient.cache.reset();
      navigate({ to: '/login' });
      toast.success(t('Logged out successfully'));
    } catch {
      toast.error(t('Failed to log out'));
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold">
          {env.appName}
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost">{t('Dashboard')}</Button>
              </Link>

              {/* Customer-specific navigation */}
              {user.role === UserRole.Customer && (
                <>
                  <Link to="/orders">
                    <Button variant="ghost">{t('My Orders')}</Button>
                  </Link>
                </>
              )}

              {/* Carrier-specific navigation */}
              {user.role === UserRole.Carrier && (
                <>
                  <Link to="/fleet">
                    <Button variant="ghost">{t('Fleet')}</Button>
                  </Link>
                  <Link to="/orders/available">
                    <Button variant="ghost">{t('Available Orders')}</Button>
                  </Link>
                </>
              )}

              <Link to="/profile">
                <Button variant="ghost">{t('Profile')}</Button>
              </Link>
              <Button onClick={handleLogout} variant="outline">
                {t('Log out')}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">{t('Login')}</Button>
              </Link>
              <Link to="/register">
                <Button>{t('Register')}</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
