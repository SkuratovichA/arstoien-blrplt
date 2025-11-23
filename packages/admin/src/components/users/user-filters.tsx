import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@arstoien/shared-ui';

interface UserFiltersProps {
  filters: {
    search: string;
    role: string | undefined;
    status: string | undefined;
  };
  onFiltersChange: (filters: {
    search: string;
    role: string | undefined;
    status: string | undefined;
  }) => void;
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Filters')}</CardTitle>
        <CardDescription>{t('Filter users by search, role, or status')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            placeholder={t('Search by name or email...')}
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
          />
          <Select
            value={filters.role}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, role: value || undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('All Roles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Roles')}</SelectItem>
              <SelectItem value="USER">{t('User')}</SelectItem>
              <SelectItem value="MODERATOR">{t('Moderator')}</SelectItem>
              <SelectItem value="ADMIN">{t('Admin')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value || undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('All Statuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Statuses')}</SelectItem>
              <SelectItem value="ACTIVE">{t('Active')}</SelectItem>
              <SelectItem value="PENDING">{t('Pending')}</SelectItem>
              <SelectItem value="SUSPENDED">{t('Suspended')}</SelectItem>
              <SelectItem value="BANNED">{t('Banned')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
