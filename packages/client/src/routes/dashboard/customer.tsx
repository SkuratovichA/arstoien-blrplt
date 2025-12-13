import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@arstoien/shared-ui';
import { useAuthStore } from '../../lib/auth-store';
import { requireAuth, requireEmailVerified, type AuthGuardContext } from '../../lib/auth-guard';
import { Package, FileText, User } from 'lucide-react';

export const Route = createFileRoute('/dashboard/customer')({
  beforeLoad: ({ context }) => {
    requireAuth(context as AuthGuardContext);
    requireEmailVerified(context as AuthGuardContext);
  },
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">
          {t('Welcome, {{name}}', { name: user?.firstName ?? user?.email })}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Create Order Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('Create Order')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {t('Create a new transportation order')}
              </p>
              <div className="space-y-2">
                <Button asChild variant="default" className="w-full">
                  <Link to="/orders/create/adhoc">{t('Ad-hoc Order')}</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/orders/create/regular">{t('Regular Order')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Orders Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('My Orders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {t('View and manage your orders')}
              </p>
              <Button asChild variant="default" className="w-full">
                <Link to="/orders">{t('View Orders')}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('Profile')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {t('Edit your personal information')}
              </p>
              <Button asChild variant="default" className="w-full">
                <Link to="/profile">{t('Edit Profile')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">{t('Recent Activity')}</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                {t('No recent activity to display')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}