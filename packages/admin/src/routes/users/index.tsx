import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { requireAuth } from '@/lib/auth-guard';
import { USERS_QUERY } from '@/graphql/users.graphql';
import { AdminLayout } from '@/components/layout/admin-layout';
import { UserTable } from '@/components/users/user-table';
import { UserFilters } from '@/components/users/user-filters';
import { Loading } from '@/components/shared/loading';
import { AddUserModal } from '@/components/users/add-user-modal';

export const Route = createFileRoute('/users/')({
  beforeLoad: () => requireAuth(),
  component: UsersPage,
});

function UsersPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{
    search: string;
    role: string | undefined;
    status: string | undefined;
  }>({
    search: '',
    role: undefined,
    status: undefined,
  });
  const [pagination, setPagination] = useState({
    skip: 0,
    take: 10,
  });

  const { data, loading, refetch } = useQuery(USERS_QUERY as Parameters<typeof useQuery>[0], {
    variables: {
      search: filters.search || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      ...pagination,
    },
  });

  const responseData = data as { users: Array<{ id: string; email: string; firstName: string; lastName: string; phone?: string | null; role: string; status: string; createdAt: string; updatedAt: string }> } | undefined;
  const users = (responseData?.users || []).map(user => ({
    ...user,
    emailVerified: false, // TODO: Add emailVerifiedAt to query and compute this
  }));
  const totalCount = users.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Users')}</h1>
            <p className="text-muted-foreground">{t('Manage all users in the system')}</p>
          </div>
          <AddUserModal onUserCreated={refetch}/>
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
