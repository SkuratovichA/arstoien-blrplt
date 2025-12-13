import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@arstoien/shared-ui';
import { useAuthStore } from '../../lib/auth-store';
import { requireAuth, requireEmailVerified, type AuthGuardContext } from '../../lib/auth-guard';
import { Truck, FileText, Building2, Gavel } from 'lucide-react';

export const Route = createFileRoute('/dashboard/carrier')({
  beforeLoad: ({ context }) => {
    requireAuth(context as AuthGuardContext);
    requireEmailVerified(context as AuthGuardContext);
  },
  component: CarrierDashboard,
});

function CarrierDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">
          {t('Carrier Dashboard')}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Manage Fleet Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {t('Manage Fleet')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {t('Add buses and upload documents')}
              </p>
              <div className="space-y-2">
                <Button asChild variant="default" className="w-full">
                  <Link to="/fleet">{t('Manage Fleet')}</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/fleet/documents">{t('Upload Documents')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Company Profile Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('Company Profile')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {t('Edit company information')}
              </p>
              <Button asChild variant="default" className="w-full">
                <Link to="/profile">{t('Edit Profile')}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* View Orders & Auctions Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                {t('Orders & Auctions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {t('View available orders and participate in auctions')}
              </p>
              <Button asChild variant="default" className="w-full">
                <Link to="/orders/available">{t('View Orders')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Overview Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">{t('Fleet Overview')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('Total Buses')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-muted-foreground text-xs">{t('Active vehicles in fleet')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('Active Orders')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-muted-foreground text-xs">{t('Currently servicing')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('Pending Bids')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-muted-foreground text-xs">{t('Awaiting response')}</p>
              </CardContent>
            </Card>
          </div>
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