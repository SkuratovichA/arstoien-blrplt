import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@arstoien/shared-ui';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Settings,
  Bell,
  User,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Pending Users',
    href: '/users/pending',
    icon: UserCheck,
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    icon: FileText,
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
];

export function AdminSidebar() {
  const { t } = useTranslation();

  return (
    <aside className="w-64 border-r bg-card">
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
            {t(item.name)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
