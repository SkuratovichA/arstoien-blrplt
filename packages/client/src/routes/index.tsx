import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../components/layout/main-layout';
import { Button } from '@arstoien/shared-ui';
import { useAuthStore } from '../lib/auth-store';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-5xl font-bold">{t('Welcome to Boilerplate')}</h1>
          <p className="text-muted-foreground mb-8 text-xl">
            {t('A modern full-stack application with authentication and GraphQL')}
          </p>
          <div className="flex justify-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg">{t('Go to dashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg">{t('Get started')}</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    {t('Sign in')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">{t('Authentication')}</h3>
            <p className="text-muted-foreground">
              {t('Secure authentication with JWT, email verification, and 2FA support')}
            </p>
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">{t('GraphQL API')}</h3>
            <p className="text-muted-foreground">
              {t('Type-safe GraphQL API powered by NestJS and Apollo')}
            </p>
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">{t('Modern stack')}</h3>
            <p className="text-muted-foreground">
              {t('Built with React, TypeScript, and TailwindCSS')}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
