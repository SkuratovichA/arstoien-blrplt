import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { requireAuth } from '@/lib/auth-guard';
import { USERS_QUERY } from '@/graphql/users.graphql';
import { AdminLayout } from '@/components/layout/admin-layout';
import { UserTable } from '@/components/users/user-table';
import { UserFilters } from '@/components/users/user-filters';
import { Loading } from '@/components/shared/loading';
import { Button } from '@arstoien/shared-ui';
import { Plus } from 'lucide-react';

export const Route = createFileRoute('/users/')({
  beforeLoad: () => requireAuth(),
  component: UsersPage,
});

function UsersPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    search: '',
    role: undefined,
    status: undefined,
  });
  const [pagination, setPagination] = useState({
    skip: 0,
    take: 10,
  });

  const { data, loading, refetch } = useQuery(USERS_QUERY, {
    variables: {
      where: {
        ...(filters.search && {
          OR: [
            { email: { contains: filters.search } },
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
          ],
        }),
        ...(filters.role && { role: { equals: filters.role } }),
        ...(filters.status && { status: { equals: filters.status } }),
      },
      orderBy: [{ createdAt: 'desc' }],
      ...pagination,
    },
  });

  const users = data?.users?.nodes || [];
  const totalCount = data?.users?.totalCount || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Users')}</h1>
            <p className="text-muted-foreground">{t('Manage all users in the system')}</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('Add User')}
          </Button>
        </div>

        <UserFilters filters={filters} onFiltersChange={setFilters} />

        {loading ? (
          <Loading />
        ) : (
          <UserTable
            users={users}
            totalCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRefetch={refetch}
          />
        )}
      </div>
    </AdminLayout>
  );
}
