import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@arstoien/shared-ui';
import { Users, UserCheck, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  stats?: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    newUsersThisMonth: number;
    userGrowth: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useTranslation();

  if (!stats) return null;

  const cards = [
    {
      title: t('Total Users'),
      value: stats.totalUsers,
      icon: Users,
      description: `+${stats.newUsersThisMonth} ${t('this month')}`,
      trend: stats.userGrowth,
    },
    {
      title: t('Active Users'),
      value: stats.activeUsers,
      icon: UserCheck,
      description: `${stats.pendingUsers} ${t('pending')}`,
    },
    {
      title: t('Growth Rate'),
      value: `${stats.userGrowth}%`,
      icon: TrendingUp,
      description: t('User growth this month'),
      trend: stats.userGrowth,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-muted-foreground text-xs">
              {card.description}
              {card.trend !== undefined && (
                <span className={card.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}
                  ({card.trend >= 0 ? '+' : ''}
                  {card.trend}%)
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
