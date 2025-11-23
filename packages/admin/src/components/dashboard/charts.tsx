import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@arstoien/shared-ui';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartsProps {
  stats?: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    newUsersThisMonth: number;
    userGrowth: number;
    revenueGrowth: number;
  };
}

export function Charts({ stats }: ChartsProps) {
  const { t } = useTranslation();

  if (!stats) return null;

  // Mock data for demonstration
  const userData = [
    { month: t('Jan'), users: 400, active: 240 },
    { month: t('Feb'), users: 500, active: 350 },
    { month: t('Mar'), users: 600, active: 450 },
    { month: t('Apr'), users: 700, active: 550 },
    { month: t('May'), users: 800, active: 650 },
    { month: t('Jun'), users: stats.totalUsers, active: stats.activeUsers },
  ];

  const revenueData = [
    { month: t('Jan'), revenue: 4000 },
    { month: t('Feb'), revenue: 5000 },
    { month: t('Mar'), revenue: 6000 },
    { month: t('Apr'), revenue: 7000 },
    { month: t('May'), revenue: 8000 },
    { month: t('Jun'), revenue: stats.monthlyRevenue },
  ];

  return (
    <>
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

      <Card>
        <CardHeader>
          <CardTitle>{t('Revenue')}</CardTitle>
          <CardDescription>{t('Monthly revenue overview')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name={t('Revenue')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
