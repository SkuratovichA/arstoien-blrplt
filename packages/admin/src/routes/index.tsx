import { useQuery } from '@apollo/client/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blrplt/ui';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Charts } from '@/components/dashboard/charts';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loading } from '@/components/shared/loading';
import { DASHBOARD_STATS_QUERY, RECENT_ACTIVITY_QUERY } from '@/graphql/admin.graphql';
import { requireAuth } from '@/lib/auth-guard';

export const Route = createFileRoute('/')({
  beforeLoad: () => requireAuth(),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const { data: statsData, loading: statsLoading } = useQuery(DASHBOARD_STATS_QUERY);
  const { data: activityData, loading: activityLoading } = useQuery(RECENT_ACTIVITY_QUERY, {
    variables: { limit: 10 },
  });

  if (statsLoading || activityLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  const rawStats = statsData?.adminStatistics;
  const activities = activityData?.recentActivity ?? [];

  // Map the available stats to the expected format
  const stats = rawStats
    ? {
        totalUsers: rawStats.totalUsers,
        activeUsers: rawStats.totalUsers - rawStats.pendingUsers, // Estimate active users
        pendingUsers: rawStats.pendingUsers,
        newUsersThisMonth: rawStats.todayRegistrations, // Using today's registrations as a placeholder
        userGrowth: 0, // Not available from current API
      }
    : undefined;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.description')}</p>
        </div>

        <StatsCards stats={stats} />

        <div className="grid gap-6 md:grid-cols-2">
          <Charts stats={stats} />

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
              <CardDescription>{t('dashboard.recentActivityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('dashboard.noRecentActivity')}</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-muted-foreground text-xs">
                          {activity.userEmail ?? t('common.system')}
                        </p>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
