import { cn } from '@blrplt/ui';
import { Link } from '@tanstack/react-router';
import { Bell, FileText, LayoutDashboard, Settings, User, UserCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AdminSidebar() {
  const { t } = useTranslation();

  // The labels are translated here, one t() call per entry, so that every key stands in the code as a literal
  const navigation = [
    {
      name: t('nav.dashboard'),
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: t('nav.users'),
      href: '/users',
      icon: Users,
    },
    {
      name: t('nav.pendingUsers'),
      href: '/users/pending',
      icon: UserCheck,
    },
    {
      name: t('nav.auditLogs'),
      href: '/audit-logs',
      icon: FileText,
    },
    {
      name: t('nav.notifications'),
      href: '/notifications',
      icon: Bell,
    },
    {
      name: t('nav.settings'),
      href: '/settings',
      icon: Settings,
    },
    {
      name: t('nav.profile'),
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <aside className="bg-card w-64 border-r">
      <nav className="space-y-1 p-4">
        {navigation.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'data-[status=active]:bg-accent data-[status=active]:text-accent-foreground'
            )}
            activeProps={{
              'data-status': 'active',
            }}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
