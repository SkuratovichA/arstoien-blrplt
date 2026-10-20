import { useQuery } from '@apollo/client/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blrplt/ui';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { USER_GROWTH_STATS_QUERY } from '@/graphql/admin.graphql';
import { monthLabel } from '@/lib/month-label';

interface ChartsProps {
  stats?: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    newUsersThisMonth: number;
    userGrowth: number;
  };
}

export function Charts({ stats }: ChartsProps) {
  const { t, i18n } = useTranslation();
  const { data: growthData, loading } = useQuery(USER_GROWTH_STATS_QUERY, {
    variables: { months: 6 },
  });

  if (!stats) return null;

  // Use real data from the query, or fall back to basic stats if loading
  const userData =
    loading || !growthData?.userGrowthStats
      ? [{ month: t('common.loading'), users: 0, active: 0 }]
      : growthData.userGrowthStats.data.map((point) => ({
          month: monthLabel(point.period, i18n.language),
          users: point.totalUsers,
          active: point.activeUsers,
        }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.userGrowth')}</CardTitle>
        <CardDescription>{t('dashboard.userGrowthDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="hsl(var(--primary))"
              name={t('dashboard.totalUsers')}
            />
            <Line
              type="monotone"
              dataKey="active"
              stroke="hsl(var(--chart-2))"
              name={t('dashboard.activeUsers')}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
