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
          {t('Welcome, {{name}}', { name: user?.firstName ?? user?.email })}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('Account information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-muted-foreground text-sm">{t('Email')}</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {user?.firstName && (
                <div>
                  <p className="text-muted-foreground text-sm">{t('Name')}</p>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm">{t('Email verified')}</p>
                <p className="font-medium">{isEmailVerified(user) ? t('Yes') : t('No')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Quick actions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{t('Quick actions will appear here')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Recent activity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{t('No recent activity')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
