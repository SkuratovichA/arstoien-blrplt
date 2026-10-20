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
} from '@blrplt/ui';
import { useTranslation } from 'react-i18next';
import { USER_STATUSES, useUserStatusLabel } from '@/lib/user-status';

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

// A select item cannot have an empty value, so "no filter" is an item of its own that the query must never receive
const ALL = 'all';

const toFilter = (value: string): string | undefined => (value === ALL ? undefined : value);

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const { t } = useTranslation();
  const statusLabel = useUserStatusLabel();

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
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
          <Select
            value={filters.role ?? ALL}
            onValueChange={(value) => onFiltersChange({ ...filters, role: toFilter(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('All Roles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('All Roles')}</SelectItem>
              <SelectItem value="USER">{t('User')}</SelectItem>
              <SelectItem value="MODERATOR">{t('Moderator')}</SelectItem>
              <SelectItem value="ADMIN">{t('Admin')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? ALL}
            onValueChange={(value) => onFiltersChange({ ...filters, status: toFilter(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('All Statuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('All Statuses')}</SelectItem>
              {USER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
