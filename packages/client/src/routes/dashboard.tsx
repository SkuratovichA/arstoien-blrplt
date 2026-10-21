import { Card, CardContent, CardHeader, CardTitle } from '@blrplt/ui';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../components/layout/main-layout';
import type { AuthGuardContext } from '../lib/auth-guard';
import { requireAuth, requireEmailVerified } from '../lib/auth-guard';
import { isEmailVerified, useAuthStore } from '../lib/auth-store';

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
          {t('dashboard.welcome', { name: user?.firstName ?? user?.email })}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.accountInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-muted-foreground text-sm">{t('dashboard.email')}</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {user?.firstName && (
                <div>
                  <p className="text-muted-foreground text-sm">{t('dashboard.name')}</p>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm">{t('dashboard.emailVerified')}</p>
                <p className="font-medium">
                  {isEmailVerified(user) ? t('common.yes') : t('common.no')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {t('dashboard.quickActionsDescription')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{t('dashboard.noActivity')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
