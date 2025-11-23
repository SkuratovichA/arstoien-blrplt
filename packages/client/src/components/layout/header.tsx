import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Button } from '@arstoien/shared-ui';
import { useAuthStore } from '../../lib/auth-store';
import { useMutation } from '@apollo/client';
import { LOGOUT } from '../../graphql/auth.graphql';
import toast from 'react-hot-toast';
import { env } from '../../lib/env';

export function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [logoutMutation] = useMutation(LOGOUT);

  const handleLogout = async () => {
    try {
      await logoutMutation();
      logout();
      toast.success(t('auth.logout.success'));
    } catch (error) {
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
                <Button variant="ghost">{t('auth.login.title')}</Button>
              </Link>
              <Link to="/register">
                <Button>{t('auth.register.title')}</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
