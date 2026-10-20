import { useApolloClient, useMutation } from '@apollo/client/react';
import { Button } from '@blrplt/ui';
import { LOGOUT } from '@graphql/auth.graphql';
import { useAuthStore } from '@lib/auth-store';
import { env } from '@lib/env';
import { Link, useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
      toast.success(t('auth.logout.success'));
    } catch {
      toast.error(t('auth.logout.error'));
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
                <Button variant="ghost">{t('nav.dashboard')}</Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost">{t('nav.profile')}</Button>
              </Link>
              <Button onClick={handleLogout} variant="outline">
                {t('auth.logout.button')}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">{t('nav.login')}</Button>
              </Link>
              <Link to="/register">
                <Button>{t('nav.register')}</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
