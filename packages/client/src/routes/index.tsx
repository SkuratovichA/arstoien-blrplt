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
          <h1 className="mb-6 text-5xl font-bold">{t('landing.title')}</h1>
          <p className="mb-8 text-xl text-muted-foreground">
            {t('landing.description')}
          </p>
          <div className="flex justify-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg">{t('landing.goToDashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg">{t('landing.getStarted')}</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    {t('landing.signIn')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">
              {t('landing.features.auth.title')}
            </h3>
            <p className="text-muted-foreground">
              {t('landing.features.auth.description')}
            </p>
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">
              {t('landing.features.graphql.title')}
            </h3>
            <p className="text-muted-foreground">
              {t('landing.features.graphql.description')}
            </p>
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">
              {t('landing.features.modern.title')}
            </h3>
            <p className="text-muted-foreground">
              {t('landing.features.modern.description')}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
