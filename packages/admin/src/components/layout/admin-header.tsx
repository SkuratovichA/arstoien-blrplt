import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/auth-store';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@arstoien/shared-ui';
import { LogOut, Settings, User } from 'lucide-react';

export function AdminHeader() {
  const { t, i18n } = useTranslation();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center gap-4 px-6">
        <div className="flex flex-1 items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">{t('Admin Panel')}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {i18n.language.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('cs')}>
                Čeština
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('sk')}>
                Slovenčina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.email} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  {t('Profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('Settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                {t('Logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
