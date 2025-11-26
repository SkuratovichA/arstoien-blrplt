import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@arstoien/shared-ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { USER_GROWTH_STATS_QUERY } from '@/graphql/admin.graphql';

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
  const { t } = useTranslation();
  const { data: growthData, loading } = useQuery(USER_GROWTH_STATS_QUERY, {
    variables: { months: 6 },
  });

  if (!stats) return null;

  // Use real data from the query, or fall back to basic stats if loading
  const userData = loading || !growthData?.userGrowthStats
    ? [
        { month: t('Loading...'), users: 0, active: 0 },
      ]
    : growthData.userGrowthStats.data.map((point) => ({
        month: t(point.period),
        users: point.totalUsers,
        active: point.activeUsers,
      }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('User Growth')}</CardTitle>
        <CardDescription>{t('Total and active users over time')}</CardDescription>
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
              name={t('Total Users')}
            />
            <Line
              type="monotone"
              dataKey="active"
              stroke="hsl(var(--chart-2))"
              name={t('Active Users')}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
