import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@arstoien/shared-ui';
import { useAuthStore, isEmailVerified } from '../lib/auth-store';
import { requireAuth, requireEmailVerified, type AuthGuardContext } from '../lib/auth-guard';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    requireAuth(context as AuthGuardContext);
    requireEmailVerified(context as AuthGuardContext);
  },
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">
          {t('dashboard.welcome', { name: user?.firstName || user?.email })}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.accountInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.email')}
                </p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {user?.firstName && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.name')}
                  </p>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.emailVerified')}
                </p>
                <p className="font-medium">
                  {isEmailVerified(user) ? t('common.yes') : t('common.no')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.twoFactor')}
                </p>
                <p className="font-medium">
                  {user?.isTwoFactorEnabled ? t('common.yes') : t('common.no')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.quickActionsDescription')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.noActivity')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
