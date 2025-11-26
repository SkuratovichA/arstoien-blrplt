import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { requireAuth } from '@/lib/auth-guard';
import { DASHBOARD_STATS_QUERY, RECENT_ACTIVITY_QUERY } from '@/graphql/admin.graphql';
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { Charts } from '@/components/dashboard/charts';
import { Loading } from '@/components/shared/loading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@arstoien/shared-ui';

export const Route = createFileRoute('/')({
  beforeLoad: () => requireAuth(),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const { data: statsData, loading: statsLoading } = useQuery(DASHBOARD_STATS_QUERY);
  const { data: activityData, loading: activityLoading } = useQuery(
    RECENT_ACTIVITY_QUERY,
    {
      variables: { limit: 10 },
    }
  );

  if (statsLoading || activityLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  const rawStats = statsData?.adminStatistics;
  const activities = activityData?.recentActivity || [];

  // Map the available stats to the expected format
  const stats = rawStats ? {
    totalUsers: rawStats.totalUsers,
    activeUsers: rawStats.totalUsers - rawStats.pendingUsers, // Estimate active users
    pendingUsers: rawStats.pendingUsers,
    newUsersThisMonth: rawStats.todayRegistrations, // Using today's registrations as a placeholder
    userGrowth: 0, // Not available from current API
  } : undefined;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Dashboard')}</h1>
          <p className="text-muted-foreground">{t('Overview of your system')}</p>
        </div>

        <StatsCards stats={stats} />

        <div className="grid gap-6 md:grid-cols-2">
          <Charts stats={stats} />

          <Card>
            <CardHeader>
              <CardTitle>{t('Recent Activity')}</CardTitle>
              <CardDescription>{t('Latest actions in the system')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No recent activity')}</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.userEmail || t('System')}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
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
